## Shared Data Models (Schemas)

Enums & Types
```TypeScript
type FraudStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'ESCALATED';
type ChannelType = 'online' | 'in_person' | 'atm';
```

`FraudCase Object`
```JSON
{
  "id": "uuid-string",
  "session_id": "uuid-string",
  "risk_score": 85.5,
  "fraud_typology": "Account Takeover",
  "timestamp": "2026-04-25T00:27:09Z",
  "status": "PENDING",
  "fraud_detection_engine_notes": {},
  "reviewer_notes": ""
}
```

`Transaction Object`
```JSON
{
  "transaction_id": "tx_000784",
  "session_id": "uuid-string",
  "timestamp": "2026-04-25T00:27:09Z",
  "card_id": "card_042",
  "amount": 18.38,
  "merchant_name": "Amazon.ca",
  "merchant_category": "online_retail",
  "channel": "online",
  "cardholder_country": "US",
  "merchant_country": "CA",
  "device_id": "dev_33892b01", 
  "ip_address": "172.58.159.61",
  "related_fraud_case_id": "uuid-string", 
  "flagged_transaction": true 
}
```

## API Endpoints

**Create Session**
- **URL:** `/session/create`
- **Method:** `POST`
- **Headers:** `Content-Type: multipart/form-data`
- **Request Body:**
    - `file`: CSV File Binary (containing your raw transaction rows)
- **Response:** `201 Created`
```JSON
{
  "session_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "transaction_count": 13
}
```

**Load Session Status**
- **URL:** `/load/session/<uuid:session_id>/`
- **Method:** `GET`
- **Response:** `200 OK`
```JSON
{
  "session_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "reviewer_name": "John Doe",
  "created_at": "2026-05-31T12:00:00Z"
}
```

**List Fraud Cases by Session**
- **URL:** `/fraud_cases/<uuid:session_id>/`
- **Method:** `GET`
- **Response:** `200 OK` (Ordered descending by `risk_score`)
```JSON
[
  {
    "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "session_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "risk_score": 98.2,
    "fraud_typology": "Cross-Border Velocity",
    "timestamp": "2026-04-25T08:19:31Z",
    "status": "PENDING",
    "fraud_detection_engine_notes": {
      "reason": "Cardholder in CA, Merchant in US, online channel"
    },
    "reviewer_notes": ""
  }
]
```

**Retrieve Fraud Case Detail**
- **URL:** `/fraud_cases/<uuid:session_id>/<uuid:pk>/`
- **Method:** `GET`
- **Response:** `200 OK` (Aggregates related transaction history arrays for investigation)
```JSON
{
  "fraud_case": {
    "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "session_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "risk_score": 98.2,
    "fraud_typology": "Cross-Border Velocity",
    "timestamp": "2026-04-25T08:19:31Z",
    "status": "PENDING",
    "fraud_detection_engine_notes": {},
    "reviewer_notes": ""
  },
  "flagged_cases": [ ...Transaction Objects linked to this specific FraudCase... ],
  "all_merchant_name": [ ...Transaction Objects sharing the same merchant... ],
  "all_device_id": [ ...Transaction Objects sharing the same device_id... ],
  "all_ip_address": [ ...Transaction Objects sharing the same ip_address... ],
  "all_card_id": [ ...Transaction Objects sharing the same card_id... ]
}
```

**Update Fraud Case**
- **URL:** `/fraud_cases/<uuid:session_id>/<uuid:pk>/`
- **Method:** `PATCH`
- **Request Body:** (Partial update payload)
```json
{
  "status": "ACCEPTED",
  "reviewer_notes": "Confirmed malicious activity with the user."
}
```
- **Response:** `200 OK` (Returns the updated complete `FraudCase` object)

**Export Session Data**
- **URL:** `/session/<uuid:session_id>/export/`
- **Method:** `GET`
- **Headers:** `Content-Type: text/csv`
- **Response:** `200 OK` 
- **Response Content-Type:** `multipart/mixed; boundary=csv_export_boundary`
```json
HTTP/1.1 200 OK
Content-Type: multipart/mixed; boundary=csv_export_boundary

--csv_export_boundary
Content-Type: text/csv
Content-Disposition: attachment; filename="session_master_ledger.csv"

transaction_id,timestamp,card_id,amount,merchant_name,merchant_category,channel,cardholder_country,merchant_country,device_id,ip_address,flagged_transaction,related_fraud_case_ids
tx_000784,2026-04-25T00:27:09Z,card_042,18.38,Amazon.ca,online_retail,online,US,CA,dev_33892b01,172.58.159.61,TRUE,9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
tx_000081,2026-04-25T00:32:37Z,card_004,160.55,Schwartz's,restaurant,in_person,CA,CA,,,FALSE,
tx_000649,2026-04-25T06:16:56Z,card_035,15.99,Disney+,subscription,online,CA,US,dev_37f4b88c,24.114.240.71,TRUE,9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d

--csv_export_boundary
Content-Type: text/csv
Content-Disposition: attachment; filename="session_flagged_ledger.csv"

transaction_id,timestamp,card_id,amount,merchant_name,merchant_category,channel,cardholder_country,merchant_country,device_id,ip_address,flagged_transaction,related_fraud_case_ids
tx_000784,2026-04-25T00:27:09Z,card_042,18.38,Amazon.ca,online_retail,online,US,CA,dev_33892b01,172.58.159.61,TRUE,9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
tx_000649,2026-04-25T06:16:56Z,card_035,15.99,Disney+,subscription,online,CA,US,dev_37f4b88c,24.114.240.71,TRUE,9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d

--csv_export_boundary
Content-Type: text/csv
Content-Disposition: attachment; filename="session_fraud_cases_summary.csv"

id,session_id,risk_score,fraud_typology,timestamp,status,fraud_detection_engine_notes,reviewer_notes
9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d,3fa85f64-5717-4562-b3fc-2c963f66afa6,85.5,Account Takeover,2026-04-25T00:27:09Z,PENDING,"{}",""
a4f2c18e-1122-3344-5566-778899aabbcc,3fa85f64-5717-4562-b3fc-2c963f66afa6,92.1,Cross-Border Velocity,2026-04-25T02:38:38Z,ACCEPTED,"{""velocity_count"": 5}","Verified structural threat pattern"

--csv_export_boundary--
```

| **Header Column**              | **Data Type**         | **Constraint / Validation Notes**                                                                                               |
| ------------------------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `id`                           | String (UUID)         | **Primary Key** for matching table relations.                                                                                   |
| `session_id`                   | String (UUID)         | Foreign key relating back to the master workspace session.                                                                      |
| `risk_score`                   | Float                 | Value ranging strictly between `0.0` and `100.0`.                                                                               |
| `fraud_typology`               | String                | Categorization string descriptor (e.g., "Account Takeover").                                                                    |
| `timestamp`                    | String (ISO 8601)     | Automatically system-generated creation time.                                                                                   |
| `status`                       | String Enum           | Restricted to: `PENDING`, `ACCEPTED`, `REJECTED`, `ESCALATED`.                                                                  |
| `fraud_detection_engine_notes` | String (Escaped JSON) | Raw engine flags serialized as a string. Must double-quote inner text tags for CSV compliance (e.g., `"{""key"": ""value""}"`). |
| `reviewer_notes`               | String                | Freeform text audit trail input from the case assessor.                                                                         |
