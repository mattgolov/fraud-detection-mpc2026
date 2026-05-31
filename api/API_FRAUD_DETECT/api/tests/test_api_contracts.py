import json
import uuid
from unittest.mock import patch, MagicMock
from datetime import datetime

from django.test import TestCase, Client
from django.utils import timezone


class SessionCreateViewTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.url = '/session/create'

    @patch('api.views.SessionService.create_session_from_csv')
    def test_session_create_201(self, mock_create):
        session_id = str(uuid.uuid4())
        mock_create.return_value = (session_id, 10)

        response = self.client.post(
            self.url,
            {'csv_content': 'test,data', 'reviewer_name': 'John'},
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn('session_id', data)
        self.assertIn('transaction_count', data)
        self.assertEqual(data['session_id'], session_id)
        self.assertEqual(data['transaction_count'], 10)

    def test_session_create_400_no_csv(self):
        response = self.client.post(
            self.url,
            {'reviewer_name': 'John'},
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn('error', data)

    @patch('api.views.SessionService.create_session_from_csv')
    def test_session_create_400_parse_error(self, mock_create):
        mock_create.side_effect = ValueError('Invalid CSV format')

        response = self.client.post(
            self.url,
            {'csv_content': 'invalid'},
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn('error', data)


class SessionLoadViewTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.session_id = uuid.uuid4()
        self.url = f'/load/session/{self.session_id}/'

    @patch('api.views.SessionService.get_session_details')
    def test_session_load_200(self, mock_get):
        mock_get.return_value = {
            'session_id': str(self.session_id),
            'reviewer_name': 'John Doe',
            'created_at': '2026-05-31T12:00:00Z',
        }

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['session_id'], str(self.session_id))
        self.assertEqual(data['reviewer_name'], 'John Doe')
        self.assertIn('created_at', data)

    @patch('api.views.SessionService.get_session_details')
    def test_session_load_404(self, mock_get):
        mock_get.side_effect = Exception('Not found')

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 404)


class FraudCaseListViewTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.session_id = uuid.uuid4()
        self.url = f'/fraud_cases/{self.session_id}/'

    @patch('api.views.FraudCaseService.get_cases_by_risk')
    def test_fraud_cases_list_200(self, mock_get):
        mock_get.return_value = [
            {
                'id': str(uuid.uuid4()),
                'session_id': str(self.session_id),
                'risk_score': 95.5,
                'fraud_typology': 'Cross-Border Velocity',
                'timestamp': '2026-04-25T08:19:31Z',
                'status': 'PENDING',
                'fraud_detection_engine_notes': {},
                'reviewer_notes': '',
            }
        ]

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 1)
        self.assertIn('id', data[0])
        self.assertIn('risk_score', data[0])
        self.assertIn('fraud_typology', data[0])

    @patch('api.views.FraudCaseService.get_cases_by_risk')
    def test_fraud_cases_list_404(self, mock_get):
        mock_get.side_effect = Exception('Not found')

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 404)


class FraudCaseDetailViewTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.session_id = uuid.uuid4()
        self.case_id = uuid.uuid4()
        self.url = f'/fraud_cases/{self.session_id}/{self.case_id}/'

    @patch('api.views.FraudCaseService.get_case_investigation_details')
    def test_fraud_case_detail_200(self, mock_get):
        mock_get.return_value = {
            'fraud_case': {
                'id': str(self.case_id),
                'session_id': str(self.session_id),
                'risk_score': 98.2,
                'fraud_typology': 'Cross-Border Velocity',
                'timestamp': '2026-04-25T08:19:31Z',
                'status': 'PENDING',
                'fraud_detection_engine_notes': {},
                'reviewer_notes': '',
            },
            'flagged_cases': [],
            'all_merchant_name': [],
            'all_device_id': [],
            'all_ip_address': [],
            'all_card_id': [],
        }

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('fraud_case', data)
        self.assertIn('flagged_cases', data)
        self.assertIn('all_merchant_name', data)
        self.assertIn('all_device_id', data)
        self.assertIn('all_ip_address', data)
        self.assertIn('all_card_id', data)

    @patch('api.views.FraudCaseService.get_case_investigation_details')
    def test_fraud_case_detail_404(self, mock_get):
        mock_get.side_effect = Exception('Not found')

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 404)

    @patch('api.views.FraudCaseService.patch_case_status')
    def test_fraud_case_patch_200(self, mock_patch):
        updated_case = {
            'id': str(self.case_id),
            'session_id': str(self.session_id),
            'risk_score': 98.2,
            'fraud_typology': 'Cross-Border Velocity',
            'timestamp': '2026-04-25T08:19:31Z',
            'status': 'ACCEPTED',
            'fraud_detection_engine_notes': {},
            'reviewer_notes': 'Confirmed malicious activity',
        }
        mock_patch.return_value = updated_case

        response = self.client.patch(
            self.url,
            data=json.dumps({'status': 'ACCEPTED', 'reviewer_notes': 'Confirmed malicious activity'}),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'ACCEPTED')
        self.assertEqual(data['reviewer_notes'], 'Confirmed malicious activity')

    @patch('api.views.FraudCaseService.patch_case_status')
    def test_fraud_case_patch_404(self, mock_patch):
        mock_patch.side_effect = Exception('Not found')

        response = self.client.patch(
            self.url,
            data=json.dumps({'status': 'ACCEPTED'}),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 404)


class SessionExportViewTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.session_id = uuid.uuid4()
        self.url = f'/session/{self.session_id}/export/'

    @patch('api.views.SessionService.generate_multi_csv_export')
    def test_session_export_200(self, mock_export):
        mock_export.return_value = (
            'transaction_id,amount\ntx_001,100.00\n',
            'transaction_id,amount\ntx_002,200.00\n',
            'id,risk_score\n123,95.5\n',
        )

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertIn('multipart/mixed', response.get('Content-Type'))
        self.assertIn('csv_export_boundary', response.get('Content-Type'))

    @patch('api.views.SessionService.generate_multi_csv_export')
    def test_session_export_boundary_count(self, mock_export):
        mock_export.return_value = (
            'transaction_id,amount\ntx_001,100.00\n',
            'transaction_id,amount\ntx_002,200.00\n',
            'id,risk_score\n123,95.5\n',
        )

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        content = response.content.decode('utf-8')
        boundary_count = content.count('--csv_export_boundary')
        self.assertEqual(boundary_count, 4)

    @patch('api.views.SessionService.generate_multi_csv_export')
    def test_session_export_filenames(self, mock_export):
        mock_export.return_value = (
            'transaction_id,amount\ntx_001,100.00\n',
            'transaction_id,amount\ntx_002,200.00\n',
            'id,risk_score\n123,95.5\n',
        )

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        content = response.content.decode('utf-8')
        self.assertIn('session_master_ledger.csv', content)
        self.assertIn('session_flagged_ledger.csv', content)
        self.assertIn('session_fraud_cases_summary.csv', content)

    @patch('api.views.SessionService.generate_multi_csv_export')
    def test_session_export_404(self, mock_export):
        mock_export.side_effect = Exception('Not found')

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 404)
