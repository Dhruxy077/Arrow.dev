// client/services/api.js
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// We use axios for simple requests
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 180000, // 3 minute timeout
});

/* Toast notification functions (unchanged) */
export const showErrorNotification = (message, details = []) => {
  console.error("Error:", message, details);
  let fullMessage = message;
  if (details.length > 0) {
    fullMessage += `\n${details.join("\n")}`;
  }
  toast.error(fullMessage);
};

export const showSuccessNotification = (message) => {
  console.log("Success:", message);
  toast.success(message);
};

/**
 * === PHASE 1: Initial Generation (Non-Streaming) ===
 * @returns {Promise<string>} - The raw XML text response.
 */
export const generateRequest = async (userInput) => {
  try {
    console.log("request going..");
    const response = await api.post(
      "/api/generate",
      { userInput },
      { responseType: "text" } // We want the raw text/xml back
    );
    return response.data; // This is the raw XML string
  } catch (error) {
    console.error("API /generate request failed:", error);
    // Throw the error's message or a default
    throw new Error(error.response?.data?.error || error.message);
  }
};

/**
 * === PHASE 3: Incremental Updates (Non-Streaming) ===
 * @returns {Promise<string>} - The raw XML text response.
 */
export const modifyRequest = async (userInput, currentFiles) => {
  try {
    const response = await api.post(
      "/api/modify",
      { userInput, currentFiles },
      { responseType: "text" } // We want the raw text/xml back
    );
    return response.data; // This is the raw XML string
  } catch (error) {
    console.error("API /modify request failed:", error);
    throw new Error(error.response?.data?.error || error.message);
  }
};
