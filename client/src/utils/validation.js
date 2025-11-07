/**
 * Input validation utilities
 */

// XSS prevention
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;

  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};

// Prompt validation
export const validatePrompt = (prompt) => {
  const errors = [];

  if (!prompt || prompt.trim() === "") {
    errors.push("Prompt cannot be empty");
  }

  if (prompt.length < 5) {
    errors.push("Prompt must be at least 5 characters long");
  }

  if (prompt.length > 1000) {
    errors.push("Prompt cannot exceed 1000 characters");
  }

  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /onload=/i,
    /onerror=/i,
    /eval\(/i,
    /document\.cookie/i,
  ];

  dangerousPatterns.forEach((pattern) => {
    if (pattern.test(prompt)) {
      errors.push("Prompt contains potentially unsafe content");
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// File path validation
export const validateFilePath = (filePath) => {
  if (!filePath || typeof filePath !== "string") {
    return false;
  }

  // Prevent directory traversal
  if (filePath.includes("..")) {
    return false;
  }

  // Prevent absolute paths
  if (filePath.startsWith("/")) {
    return false;
  }

  // Validate file extensions
  const validExtensions =
    /\.(js|jsx|ts|tsx|html|css|scss|sass|json|md|txt|svg|png|jpg|jpeg|gif|py|java|cpp|c|go|rs|php|rb|vue|svelte|astro|mdx|yaml|yml|toml)$/i;
  if (!validExtensions.test(filePath)) {
    return false;
  }

  return true;
};
