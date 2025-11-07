// server/controller/generateController.js
const { callOpenRouter } = require("../services/openRouterService");
const { INITIAL_SYSTEM_PROMPT } = require("../services/promptService");

const MODEL_PRIORITY_LIST = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "openai/gpt-oss-20b:free",
  "minimax/minimax-m2:free",
];

async function handleGenerate(req, res) {
  const { userInput } = req.body;
  if (!userInput) {
    return res.status(400).json({ error: "userInput is required" });
  }

  const promptMessages = [
    { role: "system", content: INITIAL_SYSTEM_PROMPT },
    { role: "user", content: userInput },
  ];

  let lastError = null;

  for (const modelName of MODEL_PRIORITY_LIST) {
    try {
      console.log(`Attempting with model: ${modelName}`);

      // 1. Await the FULL response. No more stream.
      const fullResponse = await callOpenRouter(modelName, promptMessages);

      console.log(`✅ Success with model: ${modelName}`);

      // 2. Send the full text response to the client
      res.setHeader("Content-Type", "text/plain");
      res.send(fullResponse);
      return;
    } catch (error) {
      console.warn(`Model ${modelName} failed: ${error.message}`);
      lastError = error;
    }
  }

  console.error("❌ All models failed.", lastError);
  res.status(503).json({
    error: lastError
      ? lastError.message
      : "All AI models are currently unavailable.",
  });
}

module.exports = { handleGenerate };
