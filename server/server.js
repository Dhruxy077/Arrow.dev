// Load environment variables from a .env file into process.env
require("dotenv").config();

const express = require("express");
const geminiRoutes = require("./routes/GeminiAPI");
const app = express();
const PORT = process.env.PORT || 3000; // Default to port 3000 if PORT is not set

// Middleware to parse JSON bodies
app.use(express.json());

// Use the GeminiAPI routes
// app.use("/api/gemini", geminiRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
