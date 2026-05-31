import csv
import io
import json
import uuid
from typing import Dict, List, Tuple, Any

from django.db import transaction

from ..models import Session, Transaction, FraudCase, FraudCaseTransaction
from .csvHandler import parse_csv
from .detect_engine import load_and_prepare_data, engineer_features, evaluate_fraud_hybrid


class SessionService:
    @staticmethod
    def create_session_from_csv(csv_text: str, reviewer_name: str = None) -> Tuple[str, int]:
        """
        Parses raw CSV string, bulk-inserts Transaction entries linked to
        a newly generated Session workspace, and kicks off fraud analysis.
        Returns: (session_id_str, total_transactions_imported)
        """
        parse_result = parse_csv(csv_text)
        if 'error' in parse_result:
            raise ValueError(parse_result['error'])

        transactions_data = parse_result['transactions']

        with transaction.atomic():
            session = Session.objects.create(reviewer_name=reviewer_name)

            transaction_objs: List[Transaction] = [
                Transaction(
                    transaction_id=tx['transaction_id'],
                    session=session,
                    timestamp=tx['timestamp'],
                    card_id=tx['card_id'],
                    amount=tx['amount'],
                    merchant_name=tx['merchant_name'],
                    merchant_category=tx['merchant_category'],
                    channel=tx['channel'],
                    cardholder_country=tx['cardholder_country'],
                    merchant_country=tx['merchant_country'],
                    device_id=tx.get('device_id'),
                    ip_address=tx.get('ip_address'),
                )
                for tx in transactions_data
            ]

            Transaction.objects.bulk_create(transaction_objs, ignore_conflicts=True)

            transactions_qs = Transaction.objects.filter(session=session)
            transaction_count = transactions_qs.count()

            if transaction_count > 0:
                df = load_and_prepare_data(list(transactions_qs.values()))
                df = engineer_features(df)
                flagged_transactions = evaluate_fraud_hybrid(df)

                fraud_cases: List[FraudCase] = []
                for tx_data in flagged_transactions:
                    fraud_case = FraudCase(
                        session=session,
                        risk_score=int(tx_data['fraud_score']),
                        fraud_typology=tx_data['fraud_reasons_str'],
                        fraud_detection_engine_notes={
                            'amount': float(tx_data['amount']),
                            'merchant_category': tx_data['merchant_category'],
                            'cross_border': tx_data['cardholder_country'] != tx_data['merchant_country'],
                        },
                    )
                    fraud_cases.append(fraud_case)

                if fraud_cases:
                    FraudCase.objects.bulk_create(fraud_cases)

                    fraud_case_transactions: List[FraudCaseTransaction] = []
                    for idx, tx_data in enumerate(flagged_transactions):
                        fraud_case = fraud_cases[idx]
                        tx_obj = Transaction.objects.get(
                            transaction_id=tx_data['transaction_id'],
                            session=session
                        )
                        fraud_case_transactions.append(
                            FraudCaseTransaction(
                                fraud_case=fraud_case,
                                transaction=tx_obj,
                            )
                        )

                    FraudCaseTransaction.objects.bulk_create(fraud_case_transactions, ignore_conflicts=True)

        return (str(session.session_id), transaction_count)

    @staticmethod
    def get_session_details(session_id: uuid.UUID) -> Dict[str, Any]:
        """Retrieves session metadata, tracking workspace initialization details."""
        session = Session.objects.get(session_id=session_id)
        return {
            'session_id': str(session.session_id),
            'reviewer_name': session.reviewer_name,
            'created_at': session.created_at.isoformat(),
        }

    @staticmethod
    def generate_multi_csv_export(session_id: uuid.UUID) -> Tuple[str, str, str]:
        """
        Generates three raw, standard string blocks representing:
        1. Master Transaction Ledger (with relational tracking headers)
        2. Flagged Transaction Ledger Only
        3. Fraud Cases Analytical Summary Records
        Returns: (master_csv_str, flagged_csv_str, summary_csv_str)
        """
        session = Session.objects.get(session_id=session_id)

        transactions = Transaction.objects.filter(session=session).prefetch_related('case_transactions')
        fraud_cases = FraudCase.objects.filter(session=session)

        master_csv = SessionService._build_master_csv(transactions)
        flagged_csv = SessionService._build_flagged_csv(transactions)
        summary_csv = SessionService._build_summary_csv(fraud_cases)

        return (master_csv, flagged_csv, summary_csv)

    @staticmethod
    def _build_master_csv(transactions) -> str:
        output = io.StringIO()
        writer = csv.writer(output, lineterminator='\r\n')

        writer.writerow([
            'transaction_id',
            'timestamp',
            'card_id',
            'amount',
            'merchant_name',
            'merchant_category',
            'channel',
            'cardholder_country',
            'merchant_country',
            'device_id',
            'ip_address',
            'flagged_transaction',
            'related_fraud_case_ids',
        ])

        for tx in transactions:
            fraud_case_ids = ','.join(
                str(case_tx.fraud_case.id)
                for case_tx in tx.case_transactions.all()
            )

            writer.writerow([
                tx.transaction_id,
                tx.timestamp.isoformat(),
                tx.card_id,
                str(tx.amount),
                tx.merchant_name,
                tx.merchant_category,
                tx.channel,
                tx.cardholder_country,
                tx.merchant_country,
                tx.device_id or '',
                tx.ip_address or '',
                'TRUE' if fraud_case_ids else 'FALSE',
                fraud_case_ids,
            ])

        return output.getvalue()

    @staticmethod
    def _build_flagged_csv(transactions) -> str:
        output = io.StringIO()
        writer = csv.writer(output, lineterminator='\r\n')

        writer.writerow([
            'transaction_id',
            'timestamp',
            'card_id',
            'amount',
            'merchant_name',
            'merchant_category',
            'channel',
            'cardholder_country',
            'merchant_country',
            'device_id',
            'ip_address',
            'flagged_transaction',
            'related_fraud_case_ids',
        ])

        for tx in transactions:
            fraud_case_ids = ','.join(
                str(case_tx.fraud_case.id)
                for case_tx in tx.case_transactions.all()
            )

            if fraud_case_ids:
                writer.writerow([
                    tx.transaction_id,
                    tx.timestamp.isoformat(),
                    tx.card_id,
                    str(tx.amount),
                    tx.merchant_name,
                    tx.merchant_category,
                    tx.channel,
                    tx.cardholder_country,
                    tx.merchant_country,
                    tx.device_id or '',
                    tx.ip_address or '',
                    'TRUE',
                    fraud_case_ids,
                ])

        return output.getvalue()

    @staticmethod
    def _build_summary_csv(fraud_cases) -> str:
        output = io.StringIO()
        writer = csv.writer(output, lineterminator='\r\n')

        writer.writerow([
            'id',
            'session_id',
            'risk_score',
            'fraud_typology',
            'timestamp',
            'status',
            'fraud_detection_engine_notes',
            'reviewer_notes',
        ])

        for fraud_case in fraud_cases:
            notes_json = json.dumps(fraud_case.fraud_detection_engine_notes)
            writer.writerow([
                str(fraud_case.id),
                str(fraud_case.session_id),
                str(fraud_case.risk_score),
                fraud_case.fraud_typology,
                fraud_case.timestamp.isoformat(),
                fraud_case.status,
                notes_json,
                fraud_case.reviewer_notes,
            ])

        return output.getvalue()


class FraudCaseService:
    @staticmethod
    def get_cases_by_risk(session_id: uuid.UUID) -> List[Dict[str, Any]]:
        """Returns FraudCase dictionary mappings ordered descending by risk_score."""
        Session.objects.get(session_id=session_id)

        fraud_cases = FraudCase.objects.filter(session_id=session_id).order_by('-risk_score')

        return [
            FraudCaseService._serialize_fraud_case(fc)
            for fc in fraud_cases
        ]

    @staticmethod
    def get_case_investigation_details(session_id: uuid.UUID, case_pk: uuid.UUID) -> Dict[str, Any]:
        """
        Aggregates a target FraudCase along with pivot logs matching its linked transactions'
        identities (all matching merchant_names, device_ids, ip_addresses, card_ids).
        """
        Session.objects.get(session_id=session_id)

        fraud_case = FraudCase.objects.get(session_id=session_id, id=case_pk)

        flagged_case_transactions = fraud_case.case_transactions.all()
        flagged_cases = [
            FraudCaseService._serialize_transaction(
                casetr.transaction,
                fraud_case_id=fraud_case.id,
                flagged=True
            )
            for casetr in flagged_case_transactions
        ]

        pivot_merchants = set()
        pivot_devices = set()
        pivot_ips = set()
        pivot_cards = set()

        for casetr in flagged_case_transactions:
            tx = casetr.transaction
            if tx.merchant_name:
                pivot_merchants.add(tx.merchant_name)
            if tx.device_id:
                pivot_devices.add(tx.device_id)
            if tx.ip_address:
                pivot_ips.add(tx.ip_address)
            if tx.card_id:
                pivot_cards.add(tx.card_id)

        all_merchant_name = []
        if pivot_merchants:
            all_merchant_name = [
                FraudCaseService._serialize_transaction(tx)
                for tx in Transaction.objects.filter(
                    session_id=session_id,
                    merchant_name__in=pivot_merchants
                )
            ]

        all_device_id = []
        if pivot_devices:
            all_device_id = [
                FraudCaseService._serialize_transaction(tx)
                for tx in Transaction.objects.filter(
                    session_id=session_id,
                    device_id__in=pivot_devices
                )
            ]

        all_ip_address = []
        if pivot_ips:
            all_ip_address = [
                FraudCaseService._serialize_transaction(tx)
                for tx in Transaction.objects.filter(
                    session_id=session_id,
                    ip_address__in=pivot_ips
                )
            ]

        all_card_id = []
        if pivot_cards:
            all_card_id = [
                FraudCaseService._serialize_transaction(tx)
                for tx in Transaction.objects.filter(
                    session_id=session_id,
                    card_id__in=pivot_cards
                )
            ]

        return {
            'fraud_case': FraudCaseService._serialize_fraud_case(fraud_case),
            'flagged_cases': flagged_cases,
            'all_merchant_name': all_merchant_name,
            'all_device_id': all_device_id,
            'all_ip_address': all_ip_address,
            'all_card_id': all_card_id,
        }

    @staticmethod
    def patch_case_status(session_id: uuid.UUID, case_pk: uuid.UUID, patch_data: Dict[str, Any]) -> Dict[str, Any]:
        """Partially updates mutable case markers (status, reviewer_notes) and returns updated object."""
        Session.objects.get(session_id=session_id)

        fraud_case = FraudCase.objects.get(session_id=session_id, id=case_pk)

        if 'status' in patch_data:
            fraud_case.status = patch_data['status']
        if 'reviewer_notes' in patch_data:
            fraud_case.reviewer_notes = patch_data['reviewer_notes']

        fraud_case.save()

        return FraudCaseService._serialize_fraud_case(fraud_case)

    @staticmethod
    def _serialize_fraud_case(fraud_case: FraudCase) -> Dict[str, Any]:
        return {
            'id': str(fraud_case.id),
            'session_id': str(fraud_case.session_id),
            'risk_score': fraud_case.risk_score,
            'fraud_typology': fraud_case.fraud_typology,
            'timestamp': fraud_case.timestamp.isoformat(),
            'status': fraud_case.status,
            'fraud_detection_engine_notes': fraud_case.fraud_detection_engine_notes,
            'reviewer_notes': fraud_case.reviewer_notes,
        }

    @staticmethod
    def _serialize_transaction(transaction: Transaction, fraud_case_id: str = None, flagged: bool = False) -> Dict[str, Any]:
        result = {
            'transaction_id': transaction.transaction_id,
            'session_id': str(transaction.session_id),
            'timestamp': transaction.timestamp.isoformat(),
            'card_id': transaction.card_id,
            'amount': float(transaction.amount),
            'merchant_name': transaction.merchant_name,
            'merchant_category': transaction.merchant_category,
            'channel': transaction.channel,
            'cardholder_country': transaction.cardholder_country,
            'merchant_country': transaction.merchant_country,
            'device_id': transaction.device_id,
            'ip_address': transaction.ip_address,
            'flagged_transaction': flagged,
        }

        if fraud_case_id:
            result['related_fraud_case_id'] = str(fraud_case_id)

        return result
