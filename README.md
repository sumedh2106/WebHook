# Webhook Delivery Engine

## Overview

This project implements a backend system for reliable webhook delivery. It accepts events, delivers them to external endpoints, retries failed deliveries using a fixed schedule, and exposes APIs to inspect delivery status.

The system is implemented in **Node.js without using any queue libraries**, as required.

---

## Features

* Event ingestion via API
* Immediate webhook delivery attempt
* Retry mechanism with fixed schedule:

  * 30 seconds
  * 5 minutes
  * 30 minutes
* Dead-letter handling after retries exhausted
* Full attempt history tracking
* HMAC-SHA256 signing for security
* Background worker (no request-triggered execution)

---

## Tech Stack

* Node.js
* Express
* Axios
* In-memory datastore (Map)

---

## Project Structure

```
.
├── server.js
├── worker.js
├── delivery.js
├── db.js
├── utils/
│   └── signature.js
```

---

## Setup Instructions

### 1. Clone repository

```
git clone <your-private-repo-url>
cd webhook-engine
```

### 2. Install dependencies

```
npm install
```

### 3. Run the server

```
node server.js
```

Server runs on:

```
http://localhost:3000
```

---

## API Endpoints

### 1. Create Event

POST /events

```
{
  "type": "user.signup",
  "payload": { "user": "meher" },
  "webhook_url": "https://example.com/webhook"
}
```

Response:

* 201 Created
* Returns event object

---

### 2. Get All Events

GET /events

---

### 3. Get Single Event

GET /events/:id

Returns event with full attempt history.

---

### 4. Retry Dead Event

POST /events/:id/retry

* Re-queues only if status = `dead`
* Returns 400 otherwise

---

## Delivery Logic

### Immediate Attempt

Events are delivered immediately upon creation.

### Retry Schedule

| Attempt   | Delay      |
| --------- | ---------- |
| 1st retry | 30 seconds |
| 2nd retry | 5 minutes  |
| 3rd retry | 30 minutes |

Total attempts: 4 (1 initial + 3 retries)

---

## Failure Conditions

A delivery is considered failed if:

* HTTP status is not 2xx
* Request times out
* Network error occurs

---

## Event Status Lifecycle

```
pending → delivered
pending → failed → retry → delivered
pending → failed → retry → failed → retry → dead
```

---

## HMAC Signature

Each outgoing request includes:

```
X-Webhook-Signature
```

### Generation

```
HMAC-SHA256(secret, JSON.stringify(payload))
```

### Verification (Receiver Side)

```js
const crypto = require("crypto");

const expected = crypto
  .createHmac("sha256", "my_secret_key")
  .update(JSON.stringify(payload))
  .digest("hex");
```

Compare with `X-Webhook-Signature`.

---

## Background Worker

* Runs every second
* Scans events for eligible retries
* Executes delivery independently of API requests

---

## Restart Behavior

This implementation uses an **in-memory datastore**.

### Implications:

* All events are lost on server restart
* Retry schedules are reset

### Note:

A production-grade system would use persistent storage (e.g., SQLite/PostgreSQL).

---

## Testing

### Success Case

Use:

```
https://webhook.site
```

### Failure Case

Use:

```
http://localhost:9999/fail
```

## Evaluation Notes

* No queue libraries used
* Retry scheduling implemented manually
* Correct delivery rules enforced
* Full attempt history tracked
* HMAC signing implemented

---

## Author

<Sumedh Vallala>
