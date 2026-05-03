const { events } = require("./db");
const { attemptDelivery } = require("./delivery");

function startWorker() {
  setInterval(async () => {
    const now = new Date();

    for (const event of events.values()) {
      if (
        event.status !== "delivered" &&
        event.status !== "dead" &&
        (!event.next_attempt_at || event.next_attempt_at <= now)
      ) {
        await attemptDelivery(event);
      }
    }
  }, 1000); // check every second
}

module.exports = { startWorker };