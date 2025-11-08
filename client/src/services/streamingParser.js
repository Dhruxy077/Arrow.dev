// client/src/services/streamingParser.js
/**
 * Incremental parser for streaming AI responses
 * Parses XML incrementally as chunks arrive
 */

export class StreamingParser {
  constructor() {
    this.buffer = "";
    this.projectName = null;
    this.files = {};
    this.updates = [];
    this.commands = []; // Extract shell commands from AI response
    this.explanation = ""; // Extract explanatory text
    this.currentFile = null;
    this.currentFileContent = "";
    this.currentUpdate = null;
    this.currentSearch = "";
    this.currentReplace = "";
    this.inProjectTag = false;
    this.inFileTag = false;
    this.inUpdateTag = false;
    this.inSearchTag = false;
    this.inReplaceTag = false;
    this.inCommandTag = false;
    this.inExplanationTag = false;
    this.inCDATA = false;
    this.cdataBuffer = "";
    this.currentCommand = "";
    this.currentExplanation = "";
  }

  /**
   * Process a chunk of text
   * @param {string} chunk - New chunk of text
   * @returns {Object} - Parsed data so far { projectName, files, updates, isComplete }
   */
  processChunk(chunk) {
    this.buffer += chunk;
    
    // Try to find and parse project tag
    if (!this.inProjectTag) {
      const projectStart = this.buffer.indexOf("<project>");
      if (projectStart !== -1) {
        this.inProjectTag = true;
        this.buffer = this.buffer.substring(projectStart);
      }
    }

    if (this.inProjectTag) {
      this.parseBuffer();
    }

    // Check if project tag is complete
    const isComplete = this.buffer.includes("</project>");

    return {
      projectName: this.projectName || "New Project",
      files: { ...this.files },
      updates: [...this.updates],
      commands: [...this.commands],
      explanation: this.explanation,
      isComplete,
    };
  }

  parseBuffer() {
    let i = 0;
    while (i < this.buffer.length) {
      // Check for CDATA start
      if (this.buffer.substring(i).startsWith("<![CDATA[")) {
        this.inCDATA = true;
        this.cdataBuffer = "";
        i += 9; // "<![CDATA[".length
        continue;
      }

      // Handle CDATA content
      if (this.inCDATA) {
        const cdataEnd = this.buffer.indexOf("]]>", i);
        if (cdataEnd !== -1) {
          // Found CDATA end
          this.cdataBuffer += this.buffer.substring(i, cdataEnd);
          this.inCDATA = false;
          
          const cdataContent = this.cdataBuffer;
          this.cdataBuffer = "";

          // Assign CDATA content based on current context
          if (this.inFileTag && this.currentFile) {
            this.currentFileContent += cdataContent;
          } else if (this.inSearchTag) {
            this.currentSearch += cdataContent;
          } else if (this.inReplaceTag) {
            this.currentReplace += cdataContent;
          } else if (this.inCommandTag) {
            this.currentCommand += cdataContent;
          } else if (this.inExplanationTag) {
            this.currentExplanation += cdataContent;
          }

          i = cdataEnd + 3; // "]]>".length
          continue;
        } else {
          // CDATA continues, accumulate
          this.cdataBuffer += this.buffer[i];
          i++;
          continue;
        }
      }

      // Handle opening tags
      if (this.buffer[i] === "<" && this.buffer[i + 1] !== "/" && this.buffer[i + 1] !== "!") {
        const tagMatch = this.buffer.substring(i).match(/^<(\w+)([^>]*)>/);
        if (tagMatch) {
          const tagName = tagMatch[1];
          const attributes = tagMatch[2];
          const tagLength = tagMatch[0].length;

          if (tagName === "projectName") {
            // Extract project name
            const nameMatch = this.buffer.substring(i + tagLength).match(/^([^<]+)</);
            if (nameMatch) {
              this.projectName = nameMatch[1].trim();
            }
          } else if (tagName === "file") {
            this.inFileTag = true;
            this.currentFile = null;
            this.currentFileContent = "";
            
            // Extract path attribute
            const pathMatch = attributes.match(/path="([^"]+)"/);
            if (pathMatch) {
              this.currentFile = pathMatch[1];
            }
          } else if (tagName === "update") {
            this.inUpdateTag = true;
            this.currentUpdate = { file: null, operations: [] };
            
            const fileMatch = attributes.match(/file="([^"]+)"/);
            if (fileMatch) {
              this.currentUpdate.file = fileMatch[1];
            }
          } else if (tagName === "search") {
            this.inSearchTag = true;
            this.currentSearch = "";
          } else if (tagName === "replace") {
            this.inReplaceTag = true;
            this.currentReplace = "";
          } else if (tagName === "command") {
            this.inCommandTag = true;
            this.currentCommand = "";
          } else if (tagName === "explanation") {
            this.inExplanationTag = true;
            this.currentExplanation = "";
          }

          i += tagLength;
          continue;
        }
      }

      // Handle closing tags
      if (this.buffer.substring(i).startsWith("</")) {
        const closeTagMatch = this.buffer.substring(i).match(/^<\/(\w+)>/);
        if (closeTagMatch) {
          const tagName = closeTagMatch[1];
          const tagLength = closeTagMatch[0].length;

          if (tagName === "file") {
            if (this.currentFile && this.currentFileContent) {
              this.files[this.currentFile] = this.currentFileContent;
            }
            this.inFileTag = false;
            this.currentFile = null;
            this.currentFileContent = "";
          } else if (tagName === "update") {
            if (this.currentUpdate && this.currentUpdate.file) {
              this.updates.push({
                file: this.currentUpdate.file,
                search: this.currentSearch,
                replace: this.currentReplace,
              });
            }
            this.inUpdateTag = false;
            this.currentUpdate = null;
            this.currentSearch = "";
            this.currentReplace = "";
          } else if (tagName === "search") {
            this.inSearchTag = false;
          } else if (tagName === "replace") {
            this.inReplaceTag = false;
          } else if (tagName === "command") {
            if (this.currentCommand.trim()) {
              this.commands.push(this.currentCommand.trim());
            }
            this.inCommandTag = false;
            this.currentCommand = "";
          } else if (tagName === "explanation") {
            this.explanation = this.currentExplanation.trim();
            this.inExplanationTag = false;
            this.currentExplanation = "";
          } else if (tagName === "project") {
            this.inProjectTag = false;
          }

          i += tagLength;
          continue;
        }
      }

      // Regular text content
      if (!this.inCDATA && (this.inFileTag || this.inSearchTag || this.inReplaceTag || this.inCommandTag || this.inExplanationTag)) {
        // Collect text content (outside CDATA)
        if (this.buffer[i] !== "<") {
          if (this.inFileTag) {
            this.currentFileContent += this.buffer[i];
          } else if (this.inSearchTag) {
            this.currentSearch += this.buffer[i];
          } else if (this.inReplaceTag) {
            this.currentReplace += this.buffer[i];
          } else if (this.inCommandTag) {
            this.currentCommand += this.buffer[i];
          } else if (this.inExplanationTag) {
            this.currentExplanation += this.buffer[i];
          }
        }
      }

      i++;
    }
  }

  /**
   * Get final parsed result
   * @returns {Object} - { projectName, files, updates }
   */
  getResult() {
    return {
      projectName: this.projectName || "New Project",
      files: { ...this.files },
      updates: [...this.updates],
      commands: [...this.commands],
      explanation: this.explanation,
      error: null,
    };
  }

  /**
   * Reset parser state
   */
  reset() {
    this.buffer = "";
    this.projectName = null;
    this.files = {};
    this.updates = [];
    this.commands = [];
    this.explanation = "";
    this.currentFile = null;
    this.currentFileContent = "";
    this.currentUpdate = null;
    this.currentSearch = "";
    this.currentReplace = "";
    this.currentCommand = "";
    this.currentExplanation = "";
    this.inProjectTag = false;
    this.inFileTag = false;
    this.inUpdateTag = false;
    this.inSearchTag = false;
    this.inReplaceTag = false;
    this.inCommandTag = false;
    this.inExplanationTag = false;
    this.inCDATA = false;
    this.cdataBuffer = "";
  }
}

