import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler



# ── Configuration ─────────────────────────────────────────────────────────────

# Categories treated as inherently high-risk regardless of amount
HIGH_RISK_CATEGORIES = {'gift_card', 'electronics', 'crypto'}

# Named payment intermediaries known to be misused for fraud cash-out
HIGH_RISK_MERCHANTS = {'quickpay online', 'quick pay', 'pay online'}

# Impossible-travel: flag country changes faster than this many hours
IMPOSSIBLE_TRAVEL_HOURS = 6

# Gift card burst: flag when N or more gift card purchases occur within this window
GIFT_CARD_BURST_COUNT = 2
GIFT_CARD_BURST_WINDOW = '2h'

# Micro-probe: flag when a large purchase follows a run of small ones
PROBE_LARGE_AMOUNT = 400    # Minimum amount to qualify as the "large" transaction
PROBE_SMALL_MAX = 50        # Prior 3 transactions must all be at or below this


# ── Data loading & base feature engineering ───────────────────────────────────

def load_and_prepare_data(transactions: list) -> pd.DataFrame:
    df = pd.DataFrame(transactions)

    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df['amount'] = df['amount'].astype(float)
    df = df.sort_values(by=['card_id', 'timestamp']).reset_index(drop=True)

    df['is_online'] = (df['channel'] == 'online').astype(int)

    df['device_id']  = df['device_id'].fillna('PHYSICAL_STORE')
    df['ip_address'] = df['ip_address'].fillna('PHYSICAL_STORE')

    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Build all features needed by the scoring rules and the ML layer.
    The dataframe is sorted by card_id + timestamp on entry; the timestamp
    index is used only for rolling time-window calculations, then removed.
    """
    df = df.set_index('timestamp').sort_index()

    # ── Velocity ──────────────────────────────────────────────────────────────
    # High Velocity
    df['card_tx_count_10m'] = (
        df.groupby('card_id')['amount']
        .rolling('10min')
        .count()
        .reset_index(level=0, drop=True)
    )
    # Very High Velocity
    df['card_tx_count_1m'] = (
        df.groupby('card_id')['amount']
        .rolling('1min')
        .count()
        .reset_index(level=0, drop=True)
    )

    # ── Amount vs card baseline ───────────────────────────────────────────────
    card_avg = df.groupby('card_id')['amount'].transform('mean')
    df['amount_to_avg_ratio'] = df['amount'] / card_avg

    # ── Country mismatch (card issued country vs merchant country) ────────────
    df['country_mismatch'] = (
        df['cardholder_country'] != df['merchant_country']
    ).astype(int)

    # ── High-risk merchant flag (category-based, not keyword regex) ───────────
    df['is_high_risk_merchant'] = (
        df['merchant_category'].isin(HIGH_RISK_CATEGORIES) |
        df['merchant_name'].str.lower().isin(HIGH_RISK_MERCHANTS)
    ).astype(int)

    # ── NEW: Gift card burst – rolling count & spend of gift_card txs ─────────
    df['_is_gift_card'] = (df['merchant_category'] == 'gift_card').astype(float)

    df['gift_card_count_2h'] = (
        df.groupby('card_id')['_is_gift_card']
        .rolling(GIFT_CARD_BURST_WINDOW)
        .sum()
        .reset_index(level=0, drop=True)
    )
    df['gift_card_spend_2h'] = (
        df.groupby('card_id')
        .apply(lambda g: g['amount']
               .where(g['merchant_category'] == 'gift_card', 0)
               .rolling(GIFT_CARD_BURST_WINDOW).sum())
        .reset_index(level=0, drop=True)
    )
    df.drop(columns=['_is_gift_card'], inplace=True)

    df = df.reset_index()  # bring timestamp back as a column

    # ── NEW: Impossible travel – previous country & time gap per card ─────────
    # Sort a fresh copy so shift() produces the true chronological predecessor
    df = df.sort_values(['card_id', 'timestamp']).reset_index(drop=True)
    df['prev_country'] = df.groupby('card_id')['cardholder_country'].shift(1)
    df['prev_timestamp'] = df.groupby('card_id')['timestamp'].shift(1)
    df['hours_since_prev_tx'] = (
        (df['timestamp'] - df['prev_timestamp'])
        .dt.total_seconds() / 3600
    )
    df['impossible_travel'] = (
        df['prev_country'].notna() &
        (df['cardholder_country'] != df['prev_country']) &
        (df['hours_since_prev_tx'] < IMPOSSIBLE_TRAVEL_HOURS)
    ).astype(int)

    # ── NEW: Micro-probe – max amount in the 3 preceding transactions ─────────
    df['prev_amount_1'] = df.groupby('card_id')['amount'].shift(1)
    df['prev_amount_2'] = df.groupby('card_id')['amount'].shift(2)
    df['prev_amount_3'] = df.groupby('card_id')['amount'].shift(3)
    df['prior_3_max'] = df[['prev_amount_1', 'prev_amount_2', 'prev_amount_3']].max(axis=1)

    df['micro_probe'] = (
        (df['amount'] >= PROBE_LARGE_AMOUNT) &
        (df['prior_3_max'] <= PROBE_SMALL_MAX) &
        df['prior_3_max'].notna()
    ).astype(int)

    # Rename prev_country so the reason string can reference it clearly
    df.rename(columns={'prev_country': 'prev_cardholder_country'}, inplace=True)

    # Drop purely intermediate columns not needed downstream
    df.drop(columns=[
        'prev_timestamp',
        'prev_amount_1', 'prev_amount_2', 'prev_amount_3',
    ], inplace=True)

    return df


# ── Hybrid fraud evaluation ────────────────────────────────────────────────────

def evaluate_fraud_hybrid(data: pd.DataFrame) -> list[dict]:
    data = data.copy()
    data['fraud_score'] = 0
    data['fraud_reasons'] = [[] for _ in range(len(data))]

    def add_score(mask, points, reason_fn):
        """Apply a score increment and append a reason string for flagged rows."""
        if callable(points):
            data.loc[mask, 'fraud_score'] += points(data.loc[mask])
        else:
            data.loc[mask, 'fraud_score'] += points
        for idx in data[mask].index:
            data.at[idx, 'fraud_reasons'].append(reason_fn(data.loc[idx]))

    # ── Layer 1: Expert heuristic scoring ─────────────────────────────────────

    # Velocity – 10 min
    m = data['card_tx_count_10m'] >= 4
    add_score(m,
              lambda d: d['card_tx_count_10m'] * 5,
              lambda r: f"High velocity 10 min ({int(r['card_tx_count_10m'])} tx)")

    # Velocity – 1 min (more severe)
    m = data['card_tx_count_1m'] >= 2
    add_score(m,
              lambda d: d['card_tx_count_1m'] * 15,
              lambda r: f"Extremely high velocity 1 min ({int(r['card_tx_count_1m'])} tx)")

    # Country mismatch (card-issuer country vs merchant country)
    m = data['country_mismatch'] == 1
    add_score(m, 15,
              lambda r: f"Country mismatch ({r['cardholder_country']} card / {r['merchant_country']} merchant)")

    # High-risk merchant + large amount
    m = (data['is_high_risk_merchant'] == 1) & (data['amount'] > 500)
    add_score(m,
              lambda d: 5 * (d['amount'] / 100).round(),
              lambda r: f"High-risk merchant, large amount (${r['amount']:.2f})")

    # ── NEW Rule 1: Impossible travel ─────────────────────────────────────────
    m = data['impossible_travel'] == 1
    add_score(m, 30,
              lambda r: (f"Impossible travel: {r['prev_cardholder_country']} → "
                         f"{r['cardholder_country']} in "
                         f"{r['hours_since_prev_tx']:.1f} h"))

    # ── NEW Rule 2: Gift card burst ───────────────────────────────────────────
    m = (
        (data['merchant_category'] == 'gift_card') &
        (data['gift_card_count_2h'] >= GIFT_CARD_BURST_COUNT)
    )
    add_score(m, 50,
              lambda r: (f"Gift card burst: {int(r['gift_card_count_2h'])} purchases, "
                         f"${r['gift_card_spend_2h']:.2f} in 2 h"))

    # ── NEW Rule 3: Micro-probe then large purchase ───────────────────────────
    m = data['micro_probe'] == 1
    add_score(m, 20,
              lambda r: (f"Micro-probe pattern: prior 3 txs max ${r['prior_3_max']:.2f}, "
                         f"then ${r['amount']:.2f} at {r['merchant_name']}"))

    # ── Layer 2: ML anomaly detection (Isolation Forest) ──────────────────────
    features = [
        'amount_to_avg_ratio',   # normalised – avoids penalising high-spenders on raw amount
        'card_tx_count_10m',
        'card_tx_count_1m',
        'country_mismatch',
        'is_high_risk_merchant',
        'gift_card_count_2h',    # new feature exposed to the model
        'impossible_travel',     # new feature exposed to the model
        'micro_probe',           # new feature exposed to the model
    ]

    scaler = StandardScaler()
    scaled = scaler.fit_transform(data[features])

    model = IsolationForest(contamination=0.05, random_state=42)
    data['iforest_anomaly'] = model.fit_predict(scaled)
    data['is_anomaly'] = (data['iforest_anomaly'] == -1).astype(int)

    m = data['is_anomaly'] == 1
    for idx in data[m].index:
        data.at[idx, 'fraud_reasons'].append(
            "Unusual pattern detected by ML model (Isolation Forest)"
        )

    # ── Final decision ────────────────────────────────────────────────────────
    data['fraud_reasons_str'] = data['fraud_reasons'].apply(
        lambda x: "; ".join(x) if x else "No flags"
    )
    data['final_fraud_decision'] = np.where(
        (data['fraud_score'] >= 60) |
        ((data['is_anomaly'] == 1) & (data['fraud_score'] >= 30)),
        "Block / Review",
        "Approve",
    )

    # List of dicts to be used for creating FraudCase and FraudCaseTransaction objects
    return data[data['final_fraud_decision'] == 'Block / Review'].to_dict(orient='records')

