import csv
from io import StringIO


def parse_csv(csv_content: str) -> dict:
    """
    Parse CSV content and return a list of transaction dictionaries.

    Args:
        csv_content: Raw CSV file content as a string

    Returns:
        Dictionary with 'transactions' list or 'error' message
    """
    lines = csv_content.strip().split('\n')

    if len(lines) < 2:
        return {'error': 'CSV file must contain at least a header and one data row'}

    reader = csv.reader(StringIO(csv_content.strip()))
    headers = [h.strip().lower() for h in next(reader)]

    transactions = []

    for row in reader:
        row = [v.strip() for v in row]

        if len(row) != len(headers):
            continue

        tx = {}
        for header, value in zip(headers, row):
            tx[header] = value

        try:
            transaction = {
                'transaction_id': tx.get('transaction_id'),
                'timestamp': tx.get('timestamp'),
                'card_id': tx.get('card_id'),
                'amount': float(tx.get('amount', 0)),
                'merchant_name': tx.get('merchant_name'),
                'merchant_category': tx.get('merchant_category'),
                'channel': tx.get('channel'),
                'cardholder_country': tx.get('cardholder_country'),
                'merchant_country': tx.get('merchant_country'),
                'device_id': tx.get('device_id') or None,
                'ip_address': tx.get('ip_address') or None,
            }
            transactions.append(transaction)
        except (ValueError, KeyError) as e:
            return {'error': f'Invalid transaction data: {str(e)}'}

    return {'transactions': transactions}
