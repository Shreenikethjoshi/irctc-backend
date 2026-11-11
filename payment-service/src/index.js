const express = require("express");

const app = express();
const port = process.env.PORT || 3002;

app.get("/health", (_req, res) => {
  res.json({ service: "payment-service", status: "ok" });
});

app.listen(port, () => {
  console.log(`payment-service listening on port ${port}`);
});
