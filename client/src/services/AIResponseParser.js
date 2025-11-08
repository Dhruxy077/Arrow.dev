/*
 * client/services/AIResponseParser.js
 *
 * This service parses the new XML-based response from the AI.
 * It now robustly finds the <project> block, ignoring any
 * conversational text the AI might add before it.
 */

/**
 * The main parser function.
 * @param {string} rawText - The full text response from the server.
 */
function parseProjectXML(rawText) {
  // --- NEW ROBUST FINDER ---
  // Find the start and end of the <project> block
  const xmlStartIndex = rawText.indexOf("<project>");
  const xmlEndIndex = rawText.lastIndexOf("</project>");

  if (xmlStartIndex === -1 || xmlEndIndex === -1) {
    throw new Error(
      "AI response did not contain a valid <project>...</project> block."
    );
  }

  // Extract *only* the XML string
  const xmlString = rawText.substring(
    xmlStartIndex,
    xmlEndIndex + "</project>".length
  );
  // --- END NEW ROBUST FINDER ---

  const parser = new DOMParser();
  // Parse only the clean XML string
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");

  // Check for a parsing error
  const parseError = xmlDoc.querySelector("parsererror");
  if (parseError) {
    throw new Error(`Failed to parse AI response: ${parseError.textContent}`);
  }

  const projectName =
    xmlDoc.querySelector("project > projectName")?.textContent.trim() ||
    "New Project";

  const files = {};
  const updates = [];
  const commands = [];
  let explanation = "";

  // 1. Find all NEW files
  xmlDoc.querySelectorAll("project > file").forEach((fileNode) => {
    const path = fileNode.getAttribute("path");
    // .textContent correctly extracts the content from CDATA
    const content = fileNode.textContent || "";
    if (path) {
      files[path] = content;
    }
  });

  // 2. Find all UPDATED files
  xmlDoc.querySelectorAll("project > update").forEach((updateNode) => {
    const filePath = updateNode.getAttribute("file");
    if (!filePath) return;

    const searchNodes = updateNode.querySelectorAll("search");
    const replaceNodes = updateNode.querySelectorAll("replace");

    for (let i = 0; i < searchNodes.length; i++) {
      const search = searchNodes[i]?.textContent || "";
      const replace = replaceNodes[i]?.textContent || "";

      updates.push({
        file: filePath,
        search: search,
        replace: replace,
      });
    }
  });

  // 3. Find all COMMANDS
  xmlDoc.querySelectorAll("project > command").forEach((commandNode) => {
    const command = commandNode.textContent?.trim() || "";
    if (command) {
      commands.push(command);
    }
  });

  // 4. Find EXPLANATION
  const explanationNode = xmlDoc.querySelector("project > explanation");
  if (explanationNode) {
    explanation = explanationNode.textContent?.trim() || "";
  }

  return { projectName, files, updates, commands, explanation };
}

/**
 * Parses the raw text response from the /api/generate endpoint.
 * @param {string} rawText - The full XML text response.
 */
export function parseInitialGeneration(rawText) {
  try {
    const { projectName, files, commands, explanation } = parseProjectXML(rawText);

    if (Object.keys(files).length === 0) {
      console.error("CustomTagParser: No files found in response.", rawText);
      throw new Error("Could not parse any files from the AI response.");
    }

    return { 
      projectName, 
      files, 
      commands: commands || [],
      explanation: explanation || "",
      error: null 
    };
  } catch (error) {
    console.error(
      "Failed to parse initial generation response:",
      error,
      rawText
    );
    return { 
      projectName: "Error", 
      files: {}, 
      commands: [],
      explanation: "",
      error: error.message 
    };
  }
}

/**
 * Parses the raw text response from the /api/modify endpoint.
 * @param {string} rawText - The full XML text diff response.
 */
export function parseModification(rawText) {
  try {
    const { projectName, files, updates, commands, explanation } = parseProjectXML(rawText);

    if (updates.length === 0 && Object.keys(files).length === 0) {
      throw new Error(
        "Could not parse any updates or new files from the AI response."
      );
    }

    // 'files' are new files, 'updates' are diffs
    return { 
      projectName, 
      updates, 
      newFiles: files,
      commands: commands || [],
      explanation: explanation || "",
      error: null 
    };
  } catch (error) {
    console.error("Failed to parse modification response:", error, rawText);
    return {
      projectName: "Error",
      updates: [],
      newFiles: {},
      commands: [],
      explanation: "",
      error: error.message,
    };
  }
}
