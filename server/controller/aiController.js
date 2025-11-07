// controllers/aiController.js
// This is the core logic for the "Priority Fallback Chain".

const { callOpenRouter } = require("../services/openRouterService");

/**
 * This is your priority list.
 * It will try the first model, and if it fails, move to the next.
 * I've populated this with good, free models from OpenRouter based on my search.
 *
 * You can re-order this list or add new models at any time!
 * Just use the model ID from OpenRouter.
 */
const MODEL_PRIORITY_LIST = [
  "google/gemini-2.0-flash-exp:free",
  "minimax/minimax-m2:free", // Good at coding and agents
  "meta-llama/llama-4-maverick:free", // Meta's advanced MoE model
  "z-ai/glm-4.5-air:free", // Good all-rounder
  "google/gemini-flash-1.5:free", // Good Google model
  "deepseek/deepseek-v3-0324:free", // Strong reasoning
  // Add any other free models you want to try here
  // "mistralai/mistral-small-3.2-24b-instruct:free",
];

/**
 * Creates the full prompt to send to the AI, instructing it to return JSON.
 * @param {string} userInput - The user's plain text prompt.
 * @returns {Array<Object>} - An array of message objects.
 */
function buildPromptMessages(userInput) {
  // We use the same system prompt logic from before, just simplified.
  // This prompt explicitly tells the model to return JSON.
  const systemPrompt = `
    You are an expert full-stack web development assistant.
    Your task is to generate a complete project structure and all file contents as a single JSON object.
    
    You MUST respond with a single, valid JSON object that matches this format:
    {
      "explanation": "A comprehensive explanation of the project structure, technologies used, and key features.",
      "files": {
        "path/to/file.js": "The complete, raw code content for this file...",
        "path/to/another/file.css": "..."
      }
    }
    
    CRITICAL FORMATTING INSTRUCTIONS:
    1.  All file content MUST be properly escaped for JSON.
    2.  All newline characters in file content MUST be escaped as \\n.
    3.  All double quotes (") in file content MUST be escaped as \\".
    4.  Do NOT include any text, markdown, or "json" tags outside of the main JSON object.
  `;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userInput },
  ];
}

/**
 * Tries to parse the JSON response from the AI.
 * This is robust and will find the JSON even if the AI wraps it in text.
 * @param {Object} apiResponse - The full response object from OpenRouter.
 * @returns {Object} - The parsed JSON object (e.g., { explanation: "...", files: { ... } }).
 */
function parseResponse(apiResponse) {
  try {
    const content = apiResponse.choices[0].message.content;

    // Find the first '{' and the last '}'
    const startIndex = content.indexOf("{");
    const endIndex = content.lastIndexOf("}");

    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
      throw new Error("AI response did not contain a valid JSON object.");
    }

    const jsonString = content.substring(startIndex, endIndex + 1);

    // Now, parse the cleaned string
    return JSON.parse(jsonString);
  } catch (parseError) {
    console.error("--- JSON PARSE FAILED ---");
    console.error(parseError.message);
    console.error(
      "Raw content from AI:",
      apiResponse.choices[0].message.content
    );
    throw new Error(`Failed to parse AI response: ${parseError.message}`);
  }
}

/**
 * Main request handler with fallback logic.
 */
async function handleProcessRequest(req, res) {
  const { userInput } = req.body;

  if (!userInput) {
    return res.status(400).json({ error: "userInput is required" });
  }

  const promptMessages = buildPromptMessages(userInput);
  let lastError = null;

  // Loop through the priority list
  for (const modelName of MODEL_PRIORITY_LIST) {
    try {
      console.log(`Attempting with model: ${modelName}`);

      // 1. Try to call the model
      const result = await callOpenRouter(modelName, promptMessages);

      // 2. Try to parse the response
      const parsedResponse = parseResponse(result);

      // 3. SUCCESS! Send the response to the client.
      console.log(`✅ Success with model: ${modelName}`);
      return res.json({
        result: parsedResponse,
        modelUsed: modelName, // Send the model name so the client knows
      });
    } catch (error) {
      // 4. FAILURE! Log the error and let the loop try the next model.
      console.warn(`Model ${modelName} failed: ${error.message}`);
      lastError = error;
      // Continue to the next iteration of the loop
    }
  }

  // 5. If the loop finishes, all models have failed.
  console.error("❌ All models failed. Returning 503 Service Unavailable.");
  res.status(503).json({
    error: "All AI models are currently unavailable. Please try again later.",
    details: lastError ? lastError.message : "No models were reachable.",
  });
}

module.exports = { handleProcessRequest };
