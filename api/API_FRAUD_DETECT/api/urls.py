from django.urls import path

from .views import (
    SessionCreateView,
    SessionLoadView,
    FraudCaseListView,
    FraudCaseUpdateView,
    SessionExportView,
)

urlpatterns = [
    path('session/create', SessionCreateView.as_view(), name='session-create'),
    path('load/session/<str:session_id>/', SessionLoadView.as_view(), name='session-load'),
    path('fraud_cases/', FraudCaseListView.as_view(), name='fraud-cases-list'),
    path('fraud_cases/<str:pk>/', FraudCaseUpdateView.as_view(), name='fraud-case-update'),
    path('session/<str:session_id>/export/', SessionExportView.as_view(), name='session-export'),
]
