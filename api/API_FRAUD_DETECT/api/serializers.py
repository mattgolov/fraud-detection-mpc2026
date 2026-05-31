from rest_framework import serializers
from .models import Session, Transaction, FraudCase, FraudCaseTransaction


class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ['session_id', 'reviewer_name', 'created_at']
        read_only_fields = ['session_id', 'created_at']


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            'transaction_id',
            'session',
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
        ]


class FraudCaseSerializer(serializers.ModelSerializer):
    transaction_ids = serializers.SerializerMethodField()

    class Meta:
        model = FraudCase
        fields = [
            'id',
            'session',
            'risk_score',
            'fraud_typology',
            'timestamp',
            'status',
            'fraud_detection_engine_notes',
            'reviewer_notes',
            'transaction_ids',
        ]
        read_only_fields = ['id', 'timestamp']

    def get_transaction_ids(self, obj: FraudCase) -> list[str]:
        return list(
            obj.case_transactions.values_list(
                'transaction__transaction_id',
                flat=True
            )
        )


class FraudCaseUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FraudCase
        fields = ['status', 'reviewer_notes']
