const express = require("express");

const app = express();
const port = process.env.PORT || 3001;

app.get("/health", (_req, res) => {
  res.json({ service: "booking-service", status: "ok" });
});

app.listen(port, () => {
  console.log(`booking-service listening on port ${port}`);
});
