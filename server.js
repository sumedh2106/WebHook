const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { events } = require("./db");
const { startWorker } = require("./worker");

const app = express();
app.use(express.json());

/**
 * POST /events
 */
app.post("/events", (req, res) => {
  const { type, payload, webhook_url } = req.body;

  const event = {
    id: uuidv4(),
    type,
    payload,
    webhook_url,
    status: "pending",
    created_at: new Date(),
    attempts: [],
    next_attempt_at: new Date(),
    attempt_count: 0
  };

  events.set(event.id, event);

  res.status(201).json(event);
});

/**
 * GET /events
 */
app.get("/events", (req, res) => {
  res.json(Array.from(events.values()));
});

/**
 * GET /events/:id
 */
app.get("/events/:id", (req, res) => {
  const event = events.get(req.params.id);
  if (!event) return res.status(404).send("Not found");
  res.json(event);
});

/**
 * POST /events/:id/retry
 */
app.post("/events/:id/retry", (req, res) => {
  const event = events.get(req.params.id);

  if (!event) return res.status(404).send("Not found");

  if (event.status !== "dead") {
    return res.status(400).json({ message: "Event not dead" });
  }

  event.status = "pending";
  event.attempt_count = 0;
  event.next_attempt_at = new Date();

  res.json({ message: "Re-queued" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startWorker();
});