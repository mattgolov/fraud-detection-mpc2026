import csv
import io
import random
from typing import Any

from django.db import transaction
from django.http import StreamingHttpResponse
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import RetrieveUpdateAPIView
from .detect_engine import load_and_prepare_data,  evaluate_fraud_hybrid, engineer_features

from .models import Session, Transaction, FraudCase, FraudCaseTransaction
from .serializers import (
    SessionSerializer,
    TransactionSerializer,
    FraudCaseSerializer,
    FraudCaseUpdateSerializer,
)


class SessionCreateView(APIView):
    def post(self, request: Request) -> Response:
        reviewer_name = request.data.get('reviewer_name')
        transactions_data = request.data.get('transactions', [])

        with transaction.atomic():
            session = Session.objects.create(reviewer_name=reviewer_name)

            transaction_objs: list[Transaction] = [
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

            transaction_count = Transaction.objects.filter(session=session).count()

        return Response(
            {
                'session_id': str(session.session_id),
                'transaction_count': transaction_count,
            },
            status=status.HTTP_201_CREATED,
        )


class SessionLoadView(APIView):
    def post(self, request: Request, session_id: str) -> Response:
        try:
            session = Session.objects.get(session_id=session_id)
        except Session.DoesNotExist:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        transactions = Transaction.objects.filter(session=session).select_related('session')

        df = load_and_prepare_data(transactions)

        flagged_transactions : list[dict] = evaluate_fraud_hybrid(df)

        with transaction.atomic():
            fraud_cases: list[FraudCase] = []
            fraud_case_transactions: list[FraudCaseTransaction] = []

            for tx in flagged_transactions:

                fraud_case = FraudCase(
                    session=session,
                    risk_score=flagged_transactions['fraud_score'],
                    fraud_typology=flagged_transactions['fraud_reasons_str'],
                    fraud_detection_engine_notes={
                        'amount': flagged_transactions['amount'],
                        'channel': flagged_transactions['merchant_category'],
                        'cross_border': tx.cardholder_country != tx.merchant_country,
                    },
                )
                fraud_cases.append(fraud_case)

            FraudCase.objects.bulk_create(fraud_cases)

            for idx, tx in enumerate(flagged_transactions):
                fraud_case = fraud_cases[idx]
                fraud_case_transactions.append(
                    FraudCaseTransaction(
                        fraud_case=fraud_case,
                        transaction=tx,
                    )
                )

            FraudCaseTransaction.objects.bulk_create(fraud_case_transactions, ignore_conflicts=True)

            fraud_case_count = FraudCase.objects.filter(session=session).count()

        return Response(
            {
                'fraud_case_count': fraud_case_count,
            },
            status=status.HTTP_201_CREATED,
        )

    @staticmethod
    def _determine_fraud_typology(tx: Transaction) -> str:
        if tx.amount > 1000:
            return 'High Value Transaction'
        if tx.cardholder_country != tx.merchant_country:
            return 'Cross-Border Fraud'
        if tx.channel == 'online' and not tx.device_id:
            return 'Account Takeover'
        return 'Velocity Spike'


class FraudCaseListView(APIView):
    def get(self, request: Request) -> Response:
        session_id = request.query_params.get('session_id')

        if not session_id:
            return Response(
                {'error': 'session_id query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            session = Session.objects.get(session_id=session_id)
        except Session.DoesNotExist:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        fraud_cases = FraudCase.objects.filter(session=session).order_by('-risk_score')
        serializer = FraudCaseSerializer(fraud_cases, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)


class FraudCaseUpdateView(RetrieveUpdateAPIView):
    queryset = FraudCase.objects.all()
    serializer_class = FraudCaseSerializer
    lookup_field = 'pk'

    def get_serializer_class(self):
        if self.request.method == 'PATCH':
            return FraudCaseUpdateSerializer
        return FraudCaseSerializer

    def patch(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        return self.partial_update(request, *args, **kwargs)


class SessionExportView(APIView):
    def get(self, request: Request, session_id: str) -> Response:
        try:
            session = Session.objects.get(session_id=session_id)
        except Session.DoesNotExist:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        fraud_cases = FraudCase.objects.filter(session=session).prefetch_related(
            'case_transactions__transaction'
        )

        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow([
            'Session ID',
            'Reviewer Name',
            'Created At',
            'Fraud Case ID',
            'Risk Score',
            'Fraud Typology',
            'Status',
            'Reviewer Notes',
            'Transaction IDs',
        ])

        for fraud_case in fraud_cases:
            transaction_ids = ','.join(
                case_tx.transaction.transaction_id
                for case_tx in fraud_case.case_transactions.all()
            )

            writer.writerow([
                str(session.session_id),
                session.reviewer_name or '',
                session.created_at.isoformat(),
                str(fraud_case.id),
                fraud_case.risk_score,
                fraud_case.fraud_typology,
                fraud_case.status,
                fraud_case.reviewer_notes,
                transaction_ids,
            ])

        output.seek(0)

        return StreamingHttpResponse(
            iter(output.readline, ''),
            content_type='text/csv',
            headers={
                'Content-Disposition': f'attachment; filename="session_{session_id}.csv"',
            },
        )
