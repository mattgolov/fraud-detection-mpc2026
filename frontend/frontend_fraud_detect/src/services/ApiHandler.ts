import type { FraudCase } from '../interface/FraudCase';
import {
  MOCK_FRAUD_CASES,
  createSession,
  getSessionData,
  getFraudCaseDetail,
  getSessionMasterLedgerCsv,
  getSessionFlaggedLedgerCsv,
  getSessionFraudCasesSummaryCsv,
  type FraudCaseDetailResponse,
  type SessionData,
  type CreateSessionResponse,
} from '../mock/MockApiData';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const IS_DEBUG_MODE = import.meta.env.VITE_DEBUG === 'true';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiHandler {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        return {
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { error: errorMessage };
    }
  }

  async uploadCsv(
    file: File,
    reviewerName: string
  ): Promise<ApiResponse<CreateSessionResponse>> {
    if (IS_DEBUG_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: createSession(reviewerName),
          });
        }, 600);
      });
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseUrl}/session/create`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        return { error: `Upload failed: ${response.statusText}` };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      return { error: errorMessage };
    }
  }

  async getSession(sessionId: string): Promise<ApiResponse<SessionData>> {
    if (IS_DEBUG_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const data = getSessionData(sessionId);
          if (!data) {
            resolve({ error: 'Session not found' });
          } else {
            resolve({ data });
          }
        }, 400);
      });
    }

    return this.request<SessionData>(`/load/session/${sessionId}/`);
  }

  async getFraudCases(sessionId: string): Promise<ApiResponse<FraudCase[]>> {
    if (IS_DEBUG_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const fraudCases = MOCK_FRAUD_CASES.filter(
            (fraudCase) => fraudCase.session_id === sessionId
          ).sort((a, b) => b.risk_score - a.risk_score);

          resolve({
            data: fraudCases,
          });
        }, 800);
      });
    }

    return this.request<FraudCase[]>(`/fraud_cases/${sessionId}/`);
  }

  async getFraudCase(
    sessionId: string,
    pk: string
  ): Promise<ApiResponse<FraudCaseDetailResponse>> {
    if (IS_DEBUG_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const detailData = getFraudCaseDetail(sessionId, pk);
          if (!detailData) {
            resolve({ error: 'Fraud case not found' });
          } else {
            resolve({ data: detailData });
          }
        }, 600);
      });
    }

    return this.request<FraudCaseDetailResponse>(
      `/fraud_cases/${sessionId}/${pk}/`
    );
  }

  async updateFraudCase(
    sessionId: string,
    pk: string,
    updates: Partial<{ status: string; reviewer_notes: string }>
  ): Promise<ApiResponse<FraudCase>> {
    if (IS_DEBUG_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const fraudCase = MOCK_FRAUD_CASES.find(
            (fc) => fc.id === pk && fc.session_id === sessionId
          );

          if (!fraudCase) {
            resolve({ error: 'Fraud case not found' });
          } else {
            const updated: FraudCase = {
              ...fraudCase,
              ...(updates.status && { status: updates.status as FraudCase['status'] }),
              ...(updates.reviewer_notes !== undefined && { reviewer_notes: updates.reviewer_notes }),
            };
            resolve({ data: updated });
          }
        }, 500);
      });
    }

    return this.request<FraudCase>(`/fraud_cases/${sessionId}/${pk}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
  }

  async exportSession(sessionId: string): Promise<ApiResponse<string>> {
    if (IS_DEBUG_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const boundary = 'csv_export_boundary';
          const masterLedger = getSessionMasterLedgerCsv();
          const flaggedLedger = getSessionFlaggedLedgerCsv();
          const fraudCasesSummary = getSessionFraudCasesSummaryCsv();

          const multipartContent = [
            `--${boundary}`,
            'Content-Type: text/csv',
            'Content-Disposition: attachment; filename="session_master_ledger.csv"',
            '',
            masterLedger,
            `--${boundary}`,
            'Content-Type: text/csv',
            'Content-Disposition: attachment; filename="session_flagged_ledger.csv"',
            '',
            flaggedLedger,
            `--${boundary}`,
            'Content-Type: text/csv',
            'Content-Disposition: attachment; filename="session_fraud_cases_summary.csv"',
            '',
            fraudCasesSummary,
            `--${boundary}--`,
          ].join('\n');

          resolve({ data: multipartContent });
        }, 1000);
      });
    }

    return this.request<string>(`/session/${sessionId}/export/`);
  }
}

export default new ApiHandler();
