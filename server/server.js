require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = 5000;
const { GoogleGenerativeAI } = require("@google/generative-ai");
const apiKey = process.env.GEMINI_API_KEY;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

app.post("/api/process-request", async (req, res) => {
  const userInput = req.body.userInput;
  console.log("Received user input:", userInput);

  try {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemma-3-27b-it" });

    // Enhanced prompt for structured code generation
    const enhancedPrompt = `
You are an expert web developer assistant. Generate complete, production-ready code based on the user's request.

IMPORTANT: Always respond with a JSON structure containing files and their contents. Format your response as:

{
  "files": {
    "filename.ext": {
      "content": "file content here"
    }
  },
  "explanation": "Brief explanation of what was created"
}

For web applications, always include:
- index.html (main HTML file)
- style.css (CSS styling)
- script.js (JavaScript functionality)
- package.json (if Node.js dependencies are needed)

Make the code modern, responsive, and production-ready with proper styling.

User request: ${userInput}
`;

    const result = await model.generateContent(enhancedPrompt);

    // Extract the text from the Gemini response
    const responseText = result.response.text();
    
    // Try to parse JSON response, fallback to plain text
    let parsedResponse;
    try {
      // Extract JSON from response if it's wrapped in markdown
      const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        // Fallback: create a simple structure
        parsedResponse = {
          files: {
            "index.html": {
              content: responseText
            }
          },
          explanation: "Generated code based on your request"
        };
      }
    } catch (parseError) {
      // If JSON parsing fails, create a simple structure
      parsedResponse = {
        files: {
          "index.html": {
            content: responseText
          }
        },
        explanation: "Generated code based on your request"
      };
    }
    
    res.json({ result: parsedResponse });
  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
