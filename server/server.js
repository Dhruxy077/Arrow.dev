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

    const result = await model.generateContent(userInput);

    // Extract the text from the Gemini response
    const responseText = result.response.text();
    // console.log(responseText);
    res.json({ result: responseText });
  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
