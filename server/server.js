// // server/server.js

// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const { GoogleGenerativeAI } = require("@google/generative-ai");
// const fs = require("fs");
// const path = require("path");

// const app = express();

// // ... (Your validateEnvironmentVariables function) ...
// const envConfig = validateEnvironmentVariables();
// const port = envConfig.PORT;
// const apiKey = envConfig.GEMINI_API_KEY;
// const nodeEnv = envConfig.NODE_ENV;

// // ... (Your prompts file loading) ...
// let prompts;
// try {
//   const promptsFilePath = path.join(__dirname, "prompt.json");
//   if (!fs.existsSync(promptsFilePath)) {
//     throw new Error(`Prompts file not found at: ${promptsFilePath}`);
//   }
//   const promptsFileContent = fs.readFileSync(promptsFilePath, "utf-8");
//   prompts = JSON.parse(promptsFileContent);
//   console.log("✅ Prompts file loaded successfully");
// } catch (error) {
//   console.error("FATAL ERROR: Failed to load prompts file:", error.message);
//   process.exit(1);
// }

// // ... (Your middleware: cors, logging, express.json) ...
// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL || "http://localhost:5173",
//     credentials: true,
//   })
// );
// if (nodeEnv === "development") {
//   app.use((req, res, next) => {
//     console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.path}`);
//     next();
//   });
// }
// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// // --- START OF NEW MODEL CONFIG ---
// // We are using 1.5-pro-latest because it's smarter and better at JSON.
// const genAI = new GoogleGenerativeAI(apiKey);
// const model = genAI.getGenerativeModel({
//   model: "gemini-1.5-flash-latest",
//   generationConfig: {
//     temperature: 0.5, // Lower temperature for more predictable JSON
//     topK: 40,
//     topP: 0.95,
//     maxOutputTokens: 8192,
//     responseMimeType: "application/json",
//   },
//   responseSchema: {
//     type: "OBJECT",
//     properties: {
//       explanation: {
//         type: "STRING",
//         description:
//           "A comprehensive explanation of the project structure, technologies used, and key features.",
//       },
//       files: {
//         type: "OBJECT",
//         description:
//           "A map of file paths (as string keys) to their complete, raw code content (as string values). Example: { 'src/App.jsx': 'import React from ...' }",
//       },
//     },
//     required: ["explanation", "files"],
//   },
// });
// // --- END OF NEW MODEL CONFIG ---

// // Health check endpoint
// app.get("/api/health", (req, res) => {
//   res.json({ status: "OK", timestamp: new Date().toISOString() });
// });

// // --- START OF NEW /api/process-request ROUTE ---
// app.post("/api/process-request", async (req, res) => {
//   const { userInput } = req.body;
//   console.log(`Request Received: ${userInput}`);

//   if (!userInput) {
//     return res.status(400).json({ error: "userInput is required" });
//   }

//   try {
//     if (!prompts || !prompts.system_prompt) {
//       throw new Error("Invalid prompts structure: missing system_prompt");
//     }

//     // --- NEW SIMPLIFIED PROMPT ---
//     // We are NOT stringifying the whole prompt.json.
//     // It's full of confusing XML (<file>, <explanation>)
//     // We will build a clean, simple prompt from its parts.
//     const basePrompt = prompts.system_prompt.base_prompt;
//     const rules = prompts.system_prompt.instructions.points.join("\n");

//     const finalPrompt = `
//       ${basePrompt}

//       You will be given a user request. Your task is to generate a complete project structure and all file contents as a single JSON object.

//       USER REQUEST: "${userInput.trim()}"

//       Follow these instructions:
//       ${rules}

//       CRITICAL FORMATTING INSTRUCTIONS:
//       1.  You MUST respond with a single, valid JSON object that matches the schema.
//       2.  The "files" object must map string file paths to their string content.
//       3.  All file content MUST be properly escaped for JSON.
//       4.  All newline characters in file content MUST be escaped as \\n.
//       5.  All double quotes (") in file content MUST be escaped as \\".
//       6.  Do NOT include any text outside of the main JSON object.
//     `;
//     // --- END OF NEW PROMPT ---

//     console.log("🚀 Sending request to Gemini AI (JSON Mode)...");

//     const result = await model.generateContent(finalPrompt);
//     const responseText = result.response.text();

//     if (!responseText) {
//       throw new Error("Empty response from Gemini AI");
//     }

//     // Find the JSON object, just in case
//     const startIndex = responseText.indexOf("{");
//     const endIndex = responseText.lastIndexOf("}");

//     if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
//       console.error("Failed to find valid JSON in AI response:", responseText);
//       throw new Error("AI response did not contain a valid JSON object.");
//     }

//     const jsonString = responseText.substring(startIndex, endIndex + 1);

//     // Add a specific try/catch for parsing to log errors better
//     let parsedResponse;
//     try {
//       parsedResponse = JSON.parse(jsonString);
//     } catch (parseError) {
//       console.error("--- JSON PARSE FAILED ---");
//       console.error("Error:", parseError.message);
//       // Log the context of the error
//       const errorPos = parseInt(
//         parseError.message.match(/position (\d+)/)?.[1] || "0"
//       );
//       console.error(
//         "Context:",
//         jsonString.substring(
//           Math.max(0, errorPos - 50),
//           Math.min(jsonString.length, errorPos + 50)
//         )
//       );
//       console.error("--- END OF FAILED JSON ---");
//       throw new Error(`Failed to parse AI response: ${parseError.message}`);
//     }

//     const response = {
//       result: parsedResponse,
//     };

//     console.log("✅ Received JSON response from Gemini AI");
//     console.log(
//       `📁 Generated ${Object.keys(parsedResponse.files).length} files`
//     );

//     res.json(response);
//   } catch (error) {
//     console.error("❌ Error in /api/process-request:", error.message);
//     if (nodeEnv === "development") {
//       console.error("Stack trace:", error.stack);
//     }

//     let status = 500;
//     let errorMessage = "Failed to process the request from the AI model.";

//     if (error.message.includes("quota")) {
//       status = 429;
//       errorMessage = "API quota exceeded. Please try again later.";
//     } else if (
//       error.message.includes("parse") ||
//       error.message.includes("JSON")
//     ) {
//       status = 502;
//       errorMessage =
//         "Failed to parse AI response. The AI might be returning unexpected format.";
//     }

//     res.status(status).json({
//       error: errorMessage,
//       details: error.message,
//       environment: nodeEnv,
//     });
//   }
// });
// // --- END OF NEW /api/process-request ROUTE ---

// // ... (Your other functions: validateEnvironmentVariables, Error handling middleware, 404 handler, app.listen) ...

// // Make sure to include all your other functions below this line
// // e.g., validateEnvironmentVariables(), app.use(error...), app.use(404...), app.listen(...)

// // ... (This is just a placeholder, make sure your original functions are here) ...

// function validateEnvironmentVariables() {
//   const missingVars = [];
//   if (!process.env.GEMINI_API_KEY) missingVars.push("GEMINI_API_KEY");
//   if (!process.env.PORT) missingVars.push("PORT");

//   if (missingVars.length > 0) {
//     console.error(
//       "❌ FATAL ERROR: Missing required environment variables:",
//       missingVars.join(", ")
//     );
//     process.exit(1);
//   }

//   console.log("🔧 Environment Configuration:");
//   console.log(`   - Environment: ${process.env.NODE_ENV || "development"}`);
//   console.log(`   - Port: ${process.env.PORT || 5000}`);
//   console.log(`   - Gemini API Key: ✅ Configured`);

//   return {
//     GEMINI_API_KEY: process.env.GEMINI_API_KEY,
//     PORT: process.env.PORT || 5000,
//     NODE_ENV: process.env.NODE_ENV || "development",
//   };
// }

// app.use((error, req, res, next) => {
//   console.error("💥 Unhandled error:", error);
//   res.status(500).json({
//     error: "Internal server error",
//     details: process.env.NODE_ENV === "development" ? error.message : undefined,
//   });
// });

// app.use((req, res) => {
//   res.status(404).json({
//     error: "Endpoint not found",
//     availableEndpoints: ["GET /api/health", "POST /api/process-request"],
//   });
// });

// app.listen(port, () => {
//   console.log(`\n🚀 Arrow.dev Server Started Successfully!`);
//   console.log(`   - Environment: ${nodeEnv}`);
//   console.log(`   - Server URL: http://localhost:${port}`);
// });

// server.js
// Main server file. Sets up Express, middleware, and routes.

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({ 
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
app.use((req, res, next) => {
  console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Import and use routes
const apiRoutes = require("./routes/api");
app.use("/api", apiRoutes);

// Simple health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Global Error Handler
app.use((error, req, res, next) => {
  console.error("💥 Global Error:", {
    message: error.message,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Don't send error if response already sent
  if (res.headersSent) {
    return next(error);
  }

  // Determine status code
  let status = 500;
  let errorMessage = "Internal server error";

  if (error.status) {
    status = error.status;
  } else if (error.message.includes("quota") || error.message.includes("rate limit")) {
    status = 429;
    errorMessage = "API rate limit exceeded. Please try again later.";
  } else if (error.message.includes("not found")) {
    status = 404;
    errorMessage = error.message;
  } else if (error.message.includes("unauthorized") || error.message.includes("auth")) {
    status = 401;
    errorMessage = "Authentication required.";
  } else if (error.message.includes("forbidden")) {
    status = 403;
    errorMessage = "Access forbidden.";
  }

  res.status(status).json({
    error: errorMessage,
    details: process.env.NODE_ENV === "development" ? error.message : undefined,
    timestamp: new Date().toISOString(),
  });
});

app.listen(port, () => {
  console.log(`\n🚀 Resilient Server Started!`);
  console.log(`   - Listening on: http://localhost:${port}`);
  console.log(
    `   - OpenRouter Key: ${
      process.env.OPENROUTER_API_KEY
        ? "✅ Loaded"
        : "❌ NOT FOUND (Check .env file)"
    }`
  );
});
