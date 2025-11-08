// server/services/openRouterService.js
const axios = require("axios");

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1";

/**
 * Calls the OpenRouter API for a single, non-streamed response.
 */
async function callOpenRouter(modelName, messages) {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set in .env file");
  }

  try {
    const response = await axios.post(
      `${OPENROUTER_API_URL}/chat/completions`,
      {
        model: modelName,
        messages: messages,
        stream: false, // <-- CRITICAL: No streaming
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 180000, // 3-minute timeout
      }
    );

    // Return the full response content
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error(
      `Error calling OpenRouter model ${modelName}:`,
      error.message
    );
    if (error.response) {
      console.error("Error details:", error.response.data);
      throw new Error(
        `OpenRouter error: ${error.response.status} ${
          error.response.data?.error?.message || error.message
        }`
      );
    }
    throw error;
  }
}

/**
 * Calls the OpenRouter API with streaming support.
 * Returns a readable stream that can be piped to the response.
 */
async function callOpenRouterStream(modelName, messages) {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set in .env file");
  }

  try {
    const response = await axios.post(
      `${OPENROUTER_API_URL}/chat/completions`,
      {
        model: modelName,
        messages: messages,
        stream: true, // Enable streaming
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        responseType: "stream",
        timeout: 180000, // 3-minute timeout
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      `Error calling OpenRouter model ${modelName} (stream):`,
      error.message
    );
    if (error.response) {
      console.error("Error details:", error.response.data);
      throw new Error(
        `OpenRouter error: ${error.response.status} ${
          error.response.data?.error?.message || error.message
        }`
      );
    }
    throw error;
  }
}

module.exports = { callOpenRouter, callOpenRouterStream };
