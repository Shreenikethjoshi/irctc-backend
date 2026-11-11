const express = require("express");

const app = express();
const port = process.env.PORT || 3003;

app.get("/health", (_req, res) => {
  res.json({ service: "search-service", status: "ok" });
});

app.listen(port, () => {
  console.log(`search-service listening on port ${port}`);
});
