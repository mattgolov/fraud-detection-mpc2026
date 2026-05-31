from django.urls import path

from .views import (
    SessionCreateView,
    SessionLoadView,
    FraudCaseListView,
    FraudCaseDetailView,
    SessionExportView,
)

urlpatterns = [
    path('session/create', SessionCreateView.as_view(), name='session-create'),
    path('load/session/<uuid:session_id>/', SessionLoadView.as_view(), name='session-load'),
    path('fraud_cases/<uuid:session_id>/', FraudCaseListView.as_view(), name='fraud-cases-list'),
    path('fraud_cases/<uuid:session_id>/<uuid:pk>/', FraudCaseDetailView.as_view(), name='fraud-case-detail'),
    path('session/<uuid:session_id>/export/', SessionExportView.as_view(), name='session-export'),
]
