import type { FraudCase } from '../interface/FraudCase';
import { MOCK_FRAUD_CASES } from '../mock/MockApiData';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const IS_DEBUG_MODE = import.meta.env.VITE_DEBUG === 'true';

interface SessionData {
  id: string;
  reviewer_name?: string;
  [key: string]: unknown;
}

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

  async uploadCsv(file: File): Promise<ApiResponse<SessionData>> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${this.baseUrl}/api/session/upload`, {
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
    return this.request<SessionData>(`/api/session/${sessionId}`);
  }

  async getFraudCases(
    sessionId: string
  ): Promise<ApiResponse<FraudCase[]>> {
    if (IS_DEBUG_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: MOCK_FRAUD_CASES.filter(
              (fraudCase) => fraudCase.session_id === sessionId
            ),
          });
        }, 800);
      });
    }

    return this.request<FraudCase[]>(
      `/api/fraud_cases/?session_id=${sessionId}`
    );
  }

  async getFraudCase(
    caseId: string,
    sessionId: string
  ): Promise<ApiResponse<FraudCase>> {
    return this.request<FraudCase>(
      `/api/fraud_cases/${caseId}?session_id=${sessionId}`
    );
  }

  async exportSession(sessionId: string): Promise<ApiResponse<unknown>> {
    return this.request(`/api/session/${sessionId}/export`);
  }

  async getSessions(): Promise<ApiResponse<SessionData[]>> {
    return this.request<SessionData[]>('/api/sessions/');
  }
}

export default new ApiHandler();
