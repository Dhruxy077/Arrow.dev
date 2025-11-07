// server/controller/modifyController.js
const { callOpenRouter } = require("../services/openRouterService");
const { FOLLOW_UP_SYSTEM_PROMPT } = require("../services/promptService");

const MODEL_PRIORITY_LIST = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "openai/gpt-oss-20b:free",
  "minimax/minimax-m2:free",
];

async function handleModify(req, res) {
  const { userInput, currentFiles } = req.body;
  if (!userInput || !currentFiles) {
    return res
      .status(400)
      .json({ error: "userInput and currentFiles are required" });
  }

  const fileContext = Object.entries(currentFiles)
    .map(([path, content]) => `<file path="${path}">\n${content}\n</file>`)
    .join("\n\n");

  const promptMessages = [
    { role: "system", content: FOLLOW_UP_SYSTEM_PROMPT },
    { role: "user", content: `Here is the current code:\n${fileContext}` },
    { role: "user", content: `Now, please apply this change: ${userInput}` },
  ];

  let lastError = null;

  for (const modelName of MODEL_PRIORITY_LIST) {
    try {
      console.log(`Attempting modification with model: ${modelName}`);

      // 1. Await the FULL response.
      const fullResponse = await callOpenRouter(modelName, promptMessages);

      console.log(`✅ Success with model: ${modelName}`);

      // 2. Send the full text response
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

module.exports = { handleModify };
