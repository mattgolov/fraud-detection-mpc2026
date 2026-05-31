import type { FraudCase } from '../interface/FraudCase';
import type { Transaction } from '../interface/Transaction';

export const SESSION_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    transaction_id: 'tx_000784',
    session_id: SESSION_ID,
    timestamp: '2026-04-25T00:27:09Z',
    card_id: 'card_042',
    amount: 18.38,
    merchant_name: 'Amazon.ca',
    merchant_category: 'online_retail',
    channel: 'online',
    cardholder_country: 'US',
    merchant_country: 'CA',
    device_id: 'dev_33892b01',
    ip_address: '172.58.159.61',
    related_fraud_case_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    flagged_transaction: true,
  },
  {
    transaction_id: 'tx_000081',
    session_id: SESSION_ID,
    timestamp: '2026-04-25T00:32:37Z',
    card_id: 'card_004',
    amount: 160.55,
    merchant_name: "Schwartz's",
    merchant_category: 'restaurant',
    channel: 'in_person',
    cardholder_country: 'CA',
    merchant_country: 'CA',
    device_id: '',
    ip_address: '',
    related_fraud_case_id: '',
    flagged_transaction: false,
  },
  {
    transaction_id: 'tx_000649',
    session_id: SESSION_ID,
    timestamp: '2026-04-25T06:16:56Z',
    card_id: 'card_035',
    amount: 15.99,
    merchant_name: 'Disney+',
    merchant_category: 'subscription',
    channel: 'online',
    cardholder_country: 'CA',
    merchant_country: 'US',
    device_id: 'dev_37f4b88c',
    ip_address: '24.114.240.71',
    related_fraud_case_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    flagged_transaction: true,
  },
  {
    transaction_id: 'tx_000512',
    session_id: SESSION_ID,
    timestamp: '2026-04-25T07:45:22Z',
    card_id: 'card_042',
    amount: 89.99,
    merchant_name: 'Best Buy',
    merchant_category: 'electronics_retail',
    channel: 'online',
    cardholder_country: 'US',
    merchant_country: 'US',
    device_id: 'dev_33892b01',
    ip_address: '192.168.1.105',
    related_fraud_case_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    flagged_transaction: true,
  },
  {
    transaction_id: 'tx_000103',
    session_id: SESSION_ID,
    timestamp: '2026-04-25T08:12:45Z',
    card_id: 'card_035',
    amount: 42.50,
    merchant_name: 'Starbucks',
    merchant_category: 'food_beverage',
    channel: 'in_person',
    cardholder_country: 'CA',
    merchant_country: 'US',
    device_id: '',
    ip_address: '',
    related_fraud_case_id: '',
    flagged_transaction: false,
  },
  {
    transaction_id: 'tx_000721',
    session_id: SESSION_ID,
    timestamp: '2026-04-25T09:33:18Z',
    card_id: 'card_042',
    amount: 205.00,
    merchant_name: 'Amazon.ca',
    merchant_category: 'online_retail',
    channel: 'online',
    cardholder_country: 'US',
    merchant_country: 'CA',
    device_id: 'dev_45c2d9e7',
    ip_address: '203.45.126.88',
    related_fraud_case_id: 'a4f2c18e-1122-3344-5566-778899aabbcc',
    flagged_transaction: true,
  },
  {
    transaction_id: 'tx_000856',
    session_id: SESSION_ID,
    timestamp: '2026-04-25T10:01:11Z',
    card_id: 'card_035',
    amount: 73.20,
    merchant_name: 'Apple Store',
    merchant_category: 'electronics_retail',
    channel: 'online',
    cardholder_country: 'CA',
    merchant_country: 'US',
    device_id: 'dev_37f4b88c',
    ip_address: '24.114.240.71',
    related_fraud_case_id: 'a4f2c18e-1122-3344-5566-778899aabbcc',
    flagged_transaction: true,
  },
];

export const MOCK_FRAUD_CASES: FraudCase[] = [
  {
    id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    session_id: SESSION_ID,
    risk_score: 98.2,
    fraud_typology: 'Cross-Border Velocity',
    timestamp: '2026-04-25T08:19:31Z',
    status: 'PENDING',
    fraud_detection_engine_notes: {
      reason: 'Cardholder in CA, Merchant in US, online channel',
    },
    reviewer_notes: '',
  },
  {
    id: 'a4f2c18e-1122-3344-5566-778899aabbcc',
    session_id: SESSION_ID,
    risk_score: 92.1,
    fraud_typology: 'Cross-Border Velocity',
    timestamp: '2026-04-25T02:38:38Z',
    status: 'ACCEPTED',
    fraud_detection_engine_notes: {
      velocity_count: 5,
    },
    reviewer_notes: 'Verified structural threat pattern',
  },
  {
    id: 'b5e3f92c-2233-4455-6677-889900bbccdd',
    session_id: SESSION_ID,
    risk_score: 75.5,
    fraud_typology: 'Account Takeover',
    timestamp: '2026-04-25T01:15:22Z',
    status: 'ESCALATED',
    fraud_detection_engine_notes: {
      reason: 'Multiple failed login attempts from unusual location',
      failed_attempts: 3,
    },
    reviewer_notes: 'Flagged for immediate investigation',
  },
];

export interface FraudCaseDetailResponse {
  fraud_case: FraudCase;
  flagged_cases: Transaction[];
  all_merchant_name: Transaction[];
  all_device_id: Transaction[];
  all_ip_address: Transaction[];
  all_card_id: Transaction[];
}

export function getFraudCaseDetail(
  sessionId: string,
  caseId: string
): FraudCaseDetailResponse | null {
  const fraudCase = MOCK_FRAUD_CASES.find(
    (fc) => fc.id === caseId && fc.session_id === sessionId
  );

  if (!fraudCase) return null;

  const flaggedCases = MOCK_TRANSACTIONS.filter(
    (tx) => tx.related_fraud_case_id === caseId
  );

  if (flaggedCases.length === 0) {
    return {
      fraud_case: fraudCase,
      flagged_cases: [],
      all_merchant_name: [],
      all_device_id: [],
      all_ip_address: [],
      all_card_id: [],
    };
  }

  const sampleFlaggedTx = flaggedCases[0];
  const merchantName = sampleFlaggedTx.merchant_name;
  const deviceId = sampleFlaggedTx.device_id;
  const ipAddress = sampleFlaggedTx.ip_address;
  const cardId = sampleFlaggedTx.card_id;

  const allMerchantName = MOCK_TRANSACTIONS.filter(
    (tx) => tx.merchant_name === merchantName && tx.session_id === sessionId
  );
  const allDeviceId =
    deviceId === ''
      ? []
      : MOCK_TRANSACTIONS.filter(
          (tx) => tx.device_id === deviceId && tx.session_id === sessionId
        );
  const allIpAddress =
    ipAddress === ''
      ? []
      : MOCK_TRANSACTIONS.filter(
          (tx) => tx.ip_address === ipAddress && tx.session_id === sessionId
        );
  const allCardId = MOCK_TRANSACTIONS.filter(
    (tx) => tx.card_id === cardId && tx.session_id === sessionId
  );

  return {
    fraud_case: fraudCase,
    flagged_cases: flaggedCases,
    all_merchant_name: allMerchantName,
    all_device_id: allDeviceId,
    all_ip_address: allIpAddress,
    all_card_id: allCardId,
  };
}

export interface SessionData {
  session_id: string;
  reviewer_name: string;
  created_at: string;
}

export function getSessionData(sessionId: string): SessionData | null {
  if (sessionId === SESSION_ID) {
    return {
      session_id: SESSION_ID,
      reviewer_name: 'John Doe',
      created_at: '2026-05-31T12:00:00Z',
    };
  }
  return null;
}

export interface CreateSessionResponse {
  session_id: string;
  transaction_count: number;
}

export function createSession(
  reviewerName: string
): CreateSessionResponse {
  return {
    session_id: SESSION_ID,
    transaction_count: MOCK_TRANSACTIONS.length,
  };
}

export function getSessionMasterLedgerCsv(): string {
  const headers = [
    'transaction_id',
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
    'flagged_transaction',
    'related_fraud_case_ids',
  ];

  const rows = MOCK_TRANSACTIONS.map((tx) => [
    tx.transaction_id,
    tx.timestamp,
    tx.card_id,
    tx.amount.toString(),
    tx.merchant_name,
    tx.merchant_category,
    tx.channel,
    tx.cardholder_country,
    tx.merchant_country,
    tx.device_id,
    tx.ip_address,
    tx.flagged_transaction ? 'TRUE' : 'FALSE',
    tx.related_fraud_case_id,
  ]);

  return [headers, ...rows].map((row) => row.join(',')).join('\n');
}

export function getSessionFlaggedLedgerCsv(): string {
  const flaggedTransactions = MOCK_TRANSACTIONS.filter(
    (tx) => tx.flagged_transaction
  );

  const headers = [
    'transaction_id',
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
    'flagged_transaction',
    'related_fraud_case_ids',
  ];

  const rows = flaggedTransactions.map((tx) => [
    tx.transaction_id,
    tx.timestamp,
    tx.card_id,
    tx.amount.toString(),
    tx.merchant_name,
    tx.merchant_category,
    tx.channel,
    tx.cardholder_country,
    tx.merchant_country,
    tx.device_id,
    tx.ip_address,
    tx.flagged_transaction ? 'TRUE' : 'FALSE',
    tx.related_fraud_case_id,
  ]);

  return [headers, ...rows].map((row) => row.join(',')).join('\n');
}

export function getSessionFraudCasesSummaryCsv(): string {
  const headers = [
    'id',
    'session_id',
    'risk_score',
    'fraud_typology',
    'timestamp',
    'status',
    'fraud_detection_engine_notes',
    'reviewer_notes',
  ];

  const rows = MOCK_FRAUD_CASES.map((fc) => [
    fc.id,
    fc.session_id,
    fc.risk_score.toString(),
    fc.fraud_typology,
    fc.timestamp,
    fc.status,
    JSON.stringify(fc.fraud_detection_engine_notes),
    fc.reviewer_notes,
  ]);

  return [headers, ...rows].map((row) => row.join(',')).join('\n');
}
