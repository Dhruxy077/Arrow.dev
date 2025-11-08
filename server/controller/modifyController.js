// server/controller/modifyController.js
const { callOpenRouter, callOpenRouterStream } = require("../services/openRouterService");
const { FOLLOW_UP_SYSTEM_PROMPT } = require("../services/promptService");

const MODEL_PRIORITY_LIST = [
  "alibaba/tongyi-deepresearch-30b-a3b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "openai/gpt-oss-20b:free",
  "minimax/minimax-m2:free",
];

async function handleModify(req, res) {
  const { userInput, currentFiles, conversationHistory = [], stream = false } = req.body;
  if (!userInput || !currentFiles) {
    return res
      .status(400)
      .json({ error: "userInput and currentFiles are required" });
  }

  // Build file context - limit to relevant files to save tokens
  const fileContext = Object.entries(currentFiles)
    .map(([path, content]) => `<file path="${path}">\n${content}\n</file>`)
    .join("\n\n");

  // Build conversation history context (last 5 messages to avoid token limits)
  const recentHistory = conversationHistory.slice(-5);
  const historyContext = recentHistory
    .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
    .join("\n\n");

  const promptMessages = [
    { role: "system", content: FOLLOW_UP_SYSTEM_PROMPT },
  ];

  // Add conversation history if available
  if (historyContext) {
    promptMessages.push({
      role: "user",
      content: `Previous conversation:\n${historyContext}\n\n---\n\nCurrent code:\n${fileContext}\n\n---\n\nUser request: ${userInput}`,
    });
  } else {
    promptMessages.push(
      { role: "user", content: `Here is the current code:\n${fileContext}` },
      { role: "user", content: `Now, please apply this change: ${userInput}` }
    );
  }

  // Handle streaming request
  if (stream) {
    return handleModifyStream(req, res, promptMessages);
  }

  // Non-streaming (original behavior)
  let lastError = null;

  for (const modelName of MODEL_PRIORITY_LIST) {
    try {
      console.log(`Attempting modification with model: ${modelName}`);

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

async function handleModifyStream(req, res, promptMessages) {
  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Cache-Control");

  // Send initial connection message
  res.write(`: connected\n\n`);
  res.flushHeaders?.(); // Flush headers immediately

  // Handle client disconnect
  let clientDisconnected = false;
  req.on("close", () => {
    console.log("Client disconnected from modify stream");
    clientDisconnected = true;
    res.end();
  });

  // Handle request abort
  req.on("aborted", () => {
    console.log("Modify request aborted by client");
    clientDisconnected = true;
    res.end();
  });

  let lastError = null;
  let streamHandled = false;

  for (const modelName of MODEL_PRIORITY_LIST) {
    if (streamHandled) break;

    try {
      console.log(`Attempting streaming modification with model: ${modelName}`);

      const stream = await callOpenRouterStream(modelName, promptMessages);
      let buffer = "";
      let isStreaming = true;

      res.write(`data: ${JSON.stringify({ type: "connected", model: modelName })}\n\n`);

      stream.on("data", (chunk) => {
        if (!isStreaming || clientDisconnected || req.closed) return;

        try {
          buffer += chunk.toString();
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.trim() === "") continue;

            if (line.startsWith("data: ")) {
              try {
                const dataStr = line.slice(6).trim();
                
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
                
                if (data.choices?.[0]?.delta?.content) {
                  const content = data.choices[0].delta.content;
                  if (content && !clientDisconnected && !req.closed) {
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                  }
                } else if (data.choices?.[0]?.message?.content) {
                  const content = data.choices[0].message.content;
                  if (content && !clientDisconnected && !req.closed) {
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                  }
                }
              } catch (parseError) {
                console.warn("Failed to parse SSE line:", line.substring(0, 100));
              }
            } else if (line.startsWith(":")) {
              continue;
            } else if (line.trim()) {
              try {
                const data = JSON.parse(line);
                if (data.content || data.choices) {
                  const content = data.content || data.choices?.[0]?.delta?.content || "";
                  if (content && !clientDisconnected && !req.closed) {
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                  }
                }
              } catch (e) {
                if (!clientDisconnected && !req.closed) {
                  res.write(`data: ${JSON.stringify({ content: line })}\n\n`);
                }
              }
            }
          }
        } catch (error) {
          console.error("Error processing modify stream chunk:", error.message);
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
          console.log(`✅ Modify stream completed successfully with model: ${modelName}`);
        }
      });

      stream.on("error", (error) => {
        console.warn(`Stream error for ${modelName}:`, error.message);
        lastError = error;
        isStreaming = false;
        
        if (!streamHandled && !clientDisconnected && !req.closed) {
          res.write(`data: ${JSON.stringify({ error: error.message, retrying: true })}\n\n`);
        }
      });

      // Wait to see if stream starts
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      if (isStreaming && !clientDisconnected) {
        streamHandled = true;
        console.log(`✅ Modify stream started successfully with model: ${modelName}`);
        return;
      } else if (clientDisconnected) {
        streamHandled = true;
        return;
      }
    } catch (error) {
      console.warn(`Model ${modelName} failed:`, error.message);
      lastError = error;
    }
  }

  // All models failed
  if (!streamHandled && !clientDisconnected && !req.closed) {
    const errorMessage = lastError?.message || "All models failed. Please try again later.";
    console.error("❌ All models failed for modify streaming:", errorMessage);
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
}

module.exports = { handleModify };
