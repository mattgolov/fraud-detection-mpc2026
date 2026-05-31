import uuid
from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Session(models.Model):
    session_id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    reviewer_name = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f"Session {self.session_id}"


class Transaction(models.Model):
    CHANNEL_CHOICES = [
        ('online', 'Online'),
        ('in_person', 'In Person'),
        ('atm', 'ATM'),
    ]

    transaction_id = models.CharField(
        primary_key=True,
        max_length=50
    )
    session = models.ForeignKey(
        Session,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    timestamp = models.DateTimeField()
    card_id = models.CharField(max_length=255)
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    merchant_name = models.CharField(max_length=255)
    merchant_category = models.CharField(max_length=255)
    channel = models.CharField(
        max_length=20,
        choices=CHANNEL_CHOICES
    )
    cardholder_country = models.CharField(max_length=2)
    merchant_country = models.CharField(max_length=2)
    device_id = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )
    ip_address = models.GenericIPAddressField(
        blank=True,
        null=True
    )

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['session', '-timestamp']),
            models.Index(fields=['card_id']),
        ]

    def __str__(self) -> str:
        return f"Transaction {self.transaction_id}"


class FraudCase(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
        ('ESCALATED', 'Escalated'),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    session = models.ForeignKey(
        Session,
        on_delete=models.CASCADE,
        related_name='fraud_cases'
    )
    risk_score = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)]
    )
    fraud_typology = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )
    fraud_detection_engine_notes = models.JSONField(default=dict)
    reviewer_notes = models.TextField(blank=True, default='')
    transactions = models.ManyToManyField(
        Transaction,
        through='FraudCaseTransaction',
        related_name='fraud_cases'
    )

    class Meta:
        ordering = ['-risk_score']
        indexes = [
            models.Index(fields=['session', '-risk_score']),
            models.Index(fields=['status']),
        ]

    def __str__(self) -> str:
        return f"FraudCase {self.id}"


class FraudCaseTransaction(models.Model):
    fraud_case = models.ForeignKey(
        FraudCase,
        on_delete=models.CASCADE,
        related_name='case_transactions'
    )
    transaction = models.ForeignKey(
        Transaction,
        on_delete=models.CASCADE,
        related_name='case_transactions'
    )

    class Meta:
        unique_together = [('fraud_case', 'transaction')]
        indexes = [
            models.Index(fields=['fraud_case']),
            models.Index(fields=['transaction']),
        ]

    def __str__(self) -> str:
        return f"FraudCaseTransaction {self.fraud_case.id} -> {self.transaction.transaction_id}"
