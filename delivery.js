const axios = require("axios");
const { generateSignature } = require("./utils/signature");

const RETRY_SCHEDULE = [30 * 1000, 5 * 60 * 1000, 30 * 60 * 1000];

async function attemptDelivery(event) {
  try {
    const signature = generateSignature(event.payload);

    const res = await axios.post(event.webhook_url, event.payload, {
      timeout: 5000,
      headers: {
        "X-Webhook-Signature": signature
      }
    });

    const success = res.status >= 200 && res.status < 300;

    logAttempt(event, res.status, success);

    if (success) {
      event.status = "delivered";
      return;
    }

    handleFailure(event);

  } catch (err) {
    logAttempt(event, null, false);
    handleFailure(event);
  }
}

function logAttempt(event, status, success) {
  event.attempts.push({
    attempted_at: new Date(),
    http_status: status,
    outcome: success ? "success" : "failed"
  });
}

function handleFailure(event) {
  event.attempt_count++;

  if (event.attempt_count > 3) {
    event.status = "dead";
    return;
  }

  const delay = RETRY_SCHEDULE[event.attempt_count - 1];
  event.next_attempt_at = new Date(Date.now() + delay);
  event.status = "failed";
}

module.exports = { attemptDelivery };