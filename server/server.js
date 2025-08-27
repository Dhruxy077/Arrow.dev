// server/server.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 5000;
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("FATAL ERROR: GEMINI_API_KEY is not configured in .env file.");
  process.exit(1);
}

// Load and parse the prompts file when the server starts
let prompts;
try {
  const promptsFilePath = path.join(__dirname, "prompt.json");

  if (!fs.existsSync(promptsFilePath)) {
    throw new Error(`Prompts file not found at: ${promptsFilePath}`);
  }

  const promptsFileContent = fs.readFileSync(promptsFilePath, "utf-8");
  prompts = JSON.parse(promptsFileContent);
  console.log("✅ Prompts file loaded successfully");
} catch (error) {
  console.error("FATAL ERROR: Failed to load prompts file:", error.message);
  process.exit(1);
}

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Initialize Gemini AI - FIXED CONFIGURATION
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192,
    // REMOVED responseMimeType - let it return natural text format
  },
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Parse the structured response from AI
function parseAIResponse(responseText) {
  try {
    // Extract explanation
    const explanationMatch = responseText.match(
      /<explanation>([\s\S]*?)<\/explanation>/
    );
    const explanation = explanationMatch
      ? explanationMatch[1].trim()
      : "No explanation provided";

    // Extract files section
    const filesMatch = responseText.match(/<files>([\s\S]*?)<\/files>/);
    if (!filesMatch) {
      throw new Error("No files section found in response");
    }

    const filesContent = filesMatch[1];
    const files = {};

    // Parse individual files
    const fileMatches = filesContent.matchAll(
      /<file path="([^"]+)">([\s\S]*?)<\/file>/g
    );

    for (const match of fileMatches) {
      const filePath = match[1];
      const fileContent = match[2].trim();
      files[filePath] = fileContent;
    }

    if (Object.keys(files).length === 0) {
      throw new Error("No files found in response");
    }

    return {
      explanation,
      files,
    };
  } catch (error) {
    console.error("Failed to parse AI response:", error.message);
    console.error("Raw response sample:", responseText.substring(0, 500));
    throw new Error(`Failed to parse AI response: ${error.message}`);
  }
}

// Main processing endpoint - FIXED
app.post("/api/process-request", async (req, res) => {
  const { userInput } = req.body;

  if (!userInput) {
    return res.status(400).json({
      error: "userInput is required",
      details: "Please provide a valid user input in the request body",
    });
  }

  if (typeof userInput !== "string" || userInput.trim().length === 0) {
    return res.status(400).json({
      error: "Invalid userInput",
      details: "userInput must be a non-empty string",
    });
  }

  console.log(
    "📝 Received user input:",
    userInput.substring(0, 100) + (userInput.length > 100 ? "..." : "")
  );

  try {
    if (!prompts || !prompts.system_prompt) {
      throw new Error("Invalid prompts structure: missing system_prompt");
    }

    // Create the final prompt by replacing the placeholder
    let finalPrompt = JSON.stringify(prompts.system_prompt, null, 2);
    finalPrompt = finalPrompt.replace(
      "{{USER_REQUEST_HERE}}",
      userInput.trim()
    );

    // Add instruction to follow the exact format
    finalPrompt +=
      '\n\nIMPORTANT: You must respond in EXACTLY this format:\n<explanation>\nYour explanation here\n</explanation>\n\n<files>\n<file path="filename.ext">\nfile content here\n</file>\n</files>';

    console.log("🚀 Sending request to Gemini AI...");

    const result = await model.generateContent(finalPrompt);

    if (!result || !result.response) {
      throw new Error("Invalid response from Gemini AI");
    }

    const responseText = result.response.text();

    if (!responseText) {
      throw new Error("Empty response from Gemini AI");
    }

    console.log("✅ Received response from Gemini AI");
    console.log("📄 Response preview:", responseText.substring(0, 200) + "...");

    // Parse the structured response
    const parsedResponse = parseAIResponse(responseText);

    const response = {
      result: parsedResponse,
    };

    console.log("📦 Sending response to client");
    console.log(
      `📁 Generated ${Object.keys(parsedResponse.files).length} files`
    );

    res.json(response);
  } catch (error) {
    console.error("❌ Error in /api/process-request:", error.message);
    console.error("Stack trace:", error.stack);

    let status = 500;
    let errorMessage = "Failed to process the request from the AI model.";

    if (error.message.includes("quota") || error.message.includes("limit")) {
      status = 429;
      errorMessage = "API quota exceeded. Please try again later.";
    } else if (error.message.includes("Invalid API key")) {
      status = 401;
      errorMessage = "Invalid API key configuration.";
    } else if (
      error.message.includes("network") ||
      error.message.includes("timeout")
    ) {
      status = 503;
      errorMessage = "Service temporarily unavailable. Please try again.";
    } else if (error.message.includes("parse")) {
      status = 502;
      errorMessage =
        "Failed to parse AI response. The AI might be returning unexpected format.";
    }

    res.status(status).json({
      error: errorMessage,
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("💥 Unhandled error:", error);
  res.status(500).json({
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    availableEndpoints: ["GET /api/health", "POST /api/process-request"],
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🔄 SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🔄 SIGINT received, shutting down gracefully...");
  process.exit(0);
});

app.listen(port, () => {
  console.log(`🚀 Server listening at http://localhost:${port}`);
  console.log(
    `📊 Health check available at http://localhost:${port}/api/health`
  );
  console.log(
    `🤖 AI endpoint available at http://localhost:${port}/api/process-request`
  );
});
