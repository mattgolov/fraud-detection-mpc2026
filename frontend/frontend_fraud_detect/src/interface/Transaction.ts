export type ChannelType = 'online' | 'in_person' | 'atm';

export interface Transaction {
  transaction_id: string;
  session_id: string;
  timestamp: string;
  card_id: string;
  amount: number;
  merchant_name: string;
  merchant_category: string;
  channel: ChannelType;
  cardholder_country: string;
  merchant_country: string;
  device_id: string;
  ip_address: string;
  related_fraud_case_id: string;
  flagged_transaction: boolean;
}
