// server/routes/api.js
const express = require("express");
const { handleGenerate } = require("../controller/generateController");
const { handleModify } = require("../controller/modifyController");

const router = express.Router();

// Health check endpoint (unchanged)
router.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Route for initial code generation (now non-streaming)
router.post("/generate", handleGenerate);

// Route for modifying existing code (now non-streaming)
router.post("/modify", handleModify);

module.exports = router;
