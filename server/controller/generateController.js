// server/controller/generateController.js
const { callOpenRouter, callOpenRouterStream } = require("../services/openRouterService");
const { INITIAL_SYSTEM_PROMPT } = require("../services/promptService");

const MODEL_PRIORITY_LIST = [
  "alibaba/tongyi-deepresearch-30b-a3b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "openai/gpt-oss-20b:free",
  "minimax/minimax-m2:free",
];

async function handleGenerate(req, res) {
  const { userInput, conversationHistory = [], stream = false } = req.body;
  if (!userInput) {
    return res.status(400).json({ error: "userInput is required" });
  }

  const promptMessages = [
    { role: "system", content: INITIAL_SYSTEM_PROMPT },
  ];

  // Add conversation history if available (for context in follow-up generations)
  if (conversationHistory && conversationHistory.length > 0) {
    // Include last 3 messages for context
    const recentHistory = conversationHistory.slice(-3);
    recentHistory.forEach((msg) => {
      promptMessages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      });
    });
  }

  // Add current user input
  promptMessages.push({ role: "user", content: userInput });

  // Handle streaming request
  if (stream) {
    return handleGenerateStream(req, res, promptMessages);
  }

  // Non-streaming (original behavior)
  let lastError = null;

  for (const modelName of MODEL_PRIORITY_LIST) {
    try {
      console.log(`Attempting with model: ${modelName}`);

      const fullResponse = await callOpenRouter(modelName, promptMessages);

      console.log(`✅ Success with model: ${modelName}`);

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

async function handleGenerateStream(req, res, promptMessages) {
  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering
  res.setHeader("Access-Control-Allow-Origin", "*"); // CORS for SSE
  res.setHeader("Access-Control-Allow-Headers", "Cache-Control");

  // Send initial connection message
  res.write(`: connected\n\n`);
  res.flushHeaders?.(); // Flush headers immediately

  // Handle client disconnect
  let clientDisconnected = false;
  req.on("close", () => {
    console.log("Client disconnected from stream");
    clientDisconnected = true;
    res.end();
  });

  // Handle request abort
  req.on("aborted", () => {
    console.log("Request aborted by client");
    clientDisconnected = true;
    res.end();
  });

  let lastError = null;
  let streamHandled = false;

  for (const modelName of MODEL_PRIORITY_LIST) {
    if (streamHandled) break;

    try {
      console.log(`Attempting streaming with model: ${modelName}`);

      const stream = await callOpenRouterStream(modelName, promptMessages);
      let buffer = "";
      let isStreaming = true;

      // Send initial connection message
      res.write(`data: ${JSON.stringify({ type: "connected", model: modelName })}\n\n`);

      stream.on("data", (chunk) => {
        if (!isStreaming || clientDisconnected || req.closed) return;

        try {
          buffer += chunk.toString();
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line

          for (const line of lines) {
            if (line.trim() === "") continue;

            if (line.startsWith("data: ")) {
              try {
                const dataStr = line.slice(6).trim();
                
                // Handle [DONE] marker
                if (dataStr === "[DONE]") {
                  isStreaming = false;
                  if (!clientDisconnected && !req.closed) {
                    res.write("data: [DONE]\n\n");
                    res.end();
                  }
                  streamHandled = true;
                  return;
                }

                const data = JSON.parse(dataStr);
                
                // Extract content from OpenRouter format
                if (data.choices?.[0]?.delta?.content) {
                  const content = data.choices[0].delta.content;
                  if (content && !clientDisconnected && !req.closed) {
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                  }
                } else if (data.choices?.[0]?.message?.content) {
                  // Some models return full message
                  const content = data.choices[0].message.content;
                  if (content && !clientDisconnected && !req.closed) {
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                  }
                }
              } catch (parseError) {
                // Try to extract content directly if JSON parse fails
                if (line.includes("content")) {
                  console.warn("Failed to parse SSE line:", line.substring(0, 100));
                }
              }
            } else if (line.startsWith(":")) {
              // SSE comment, ignore
              continue;
            } else if (line.trim()) {
              // Try to parse as direct content
              try {
                const data = JSON.parse(line);
                if (data.content || data.choices) {
                  const content = data.content || data.choices?.[0]?.delta?.content || "";
                  if (content && !clientDisconnected && !req.closed) {
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                  }
                }
              } catch (e) {
                // Not JSON, might be plain text - send as content
                if (!clientDisconnected && !req.closed) {
                  res.write(`data: ${JSON.stringify({ content: line })}\n\n`);
                }
              }
            }
          }
        } catch (error) {
          console.error("Error processing stream chunk:", error.message);
          if (!clientDisconnected && !req.closed) {
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
          }
        }
      });

      stream.on("end", () => {
        if (!streamHandled && !clientDisconnected && !req.closed) {
          isStreaming = false;
          res.write("data: [DONE]\n\n");
          res.end();
          streamHandled = true;
          console.log(`✅ Stream completed successfully with model: ${modelName}`);
        }
      });

      stream.on("error", (error) => {
        console.warn(`Stream error for ${modelName}:`, error.message);
        lastError = error;
        isStreaming = false;
        
        if (!streamHandled && !clientDisconnected && !req.closed) {
          // Try next model
          res.write(`data: ${JSON.stringify({ error: error.message, retrying: true })}\n\n`);
        }
      });

      // Wait a bit to see if stream starts successfully
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      if (isStreaming && !clientDisconnected) {
        streamHandled = true;
        console.log(`✅ Stream started successfully with model: ${modelName}`);
        return; // Success, exit
      } else if (clientDisconnected) {
        streamHandled = true;
        return; // Client disconnected, exit
      }
    } catch (error) {
      console.warn(`Model ${modelName} failed:`, error.message);
      lastError = error;
    }
  }

  // All models failed
  if (!streamHandled && !clientDisconnected && !req.closed) {
    const errorMessage = lastError?.message || "All models failed. Please try again later.";
    console.error("❌ All models failed for streaming:", errorMessage);
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
}

module.exports = { handleGenerate };
