export type FraudStatus = 'ACCEPTED' | 'REJECTED' | 'ESCALATED';

export interface FraudCase {
  id: string;
  session_id: string;
  risk_score: number;
  fraud_typology: string;
  timestamp: string;
  status: FraudStatus;
  fraud_detection_engine_notes: Record<string, unknown>;
  reviewer_notes: string;
}
