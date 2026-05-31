from django.http import HttpResponse, Http404
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .services.services import SessionService, FraudCaseService


class SessionCreateView(APIView):
    def post(self, request: Request) -> Response:
        reviewer_name = request.data.get('reviewer_name')
        csv_content = request.data.get('csv_content')

        if not csv_content:
            return Response(
                {'error': 'csv_content is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            session_id, transaction_count = SessionService.create_session_from_csv(
                csv_content,
                reviewer_name=reviewer_name
            )
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                'session_id': session_id,
                'transaction_count': transaction_count,
            },
            status=status.HTTP_201_CREATED,
        )


class SessionLoadView(APIView):
    def get(self, request: Request, session_id: str) -> Response:
        try:
            details = SessionService.get_session_details(session_id)
        except Exception:
            raise Http404('Session not found')

        return Response(details, status=status.HTTP_200_OK)


class FraudCaseListView(APIView):
    def get(self, request: Request, session_id: str) -> Response:
        try:
            fraud_cases = FraudCaseService.get_cases_by_risk(session_id)
        except Exception:
            raise Http404('Session not found')

        return Response(fraud_cases, status=status.HTTP_200_OK)


class FraudCaseDetailView(APIView):
    def get(self, request: Request, session_id: str, pk: str) -> Response:
        try:
            details = FraudCaseService.get_case_investigation_details(session_id, pk)
        except Exception:
            raise Http404('Fraud case not found')

        return Response(details, status=status.HTTP_200_OK)

    def patch(self, request: Request, session_id: str, pk: str) -> Response:
        try:
            updated_case = FraudCaseService.patch_case_status(session_id, pk, request.data)
        except Exception:
            raise Http404('Fraud case not found')

        return Response(updated_case, status=status.HTTP_200_OK)


class SessionExportView(APIView):
    def get(self, request: Request, session_id: str) -> HttpResponse:
        try:
            master_csv, flagged_csv, summary_csv = SessionService.generate_multi_csv_export(session_id)
        except Exception:
            raise Http404('Session not found')

        boundary = 'csv_export_boundary'
        multipart_body = (
            f'--{boundary}\r\n'
            f'Content-Type: text/csv\r\n'
            f'Content-Disposition: attachment; filename="session_master_ledger.csv"\r\n\r\n'
            f'{master_csv}\r\n'
            f'--{boundary}\r\n'
            f'Content-Type: text/csv\r\n'
            f'Content-Disposition: attachment; filename="session_flagged_ledger.csv"\r\n\r\n'
            f'{flagged_csv}\r\n'
            f'--{boundary}\r\n'
            f'Content-Type: text/csv\r\n'
            f'Content-Disposition: attachment; filename="session_fraud_cases_summary.csv"\r\n\r\n'
            f'{summary_csv}\r\n'
            f'--{boundary}--\r\n'
        )

        response = HttpResponse(
            multipart_body,
            content_type=f'multipart/mixed; boundary={boundary}'
        )
        return response
