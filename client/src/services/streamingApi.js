// client/src/services/streamingApi.js
/**
 * Server-Sent Events (SSE) streaming API client
 * Handles real-time streaming of AI responses with proper error handling and retry logic
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Stream AI generation response
 * @param {string} userInput - User's prompt
 * @param {Object} options - Streaming options
 * @param {Function} onChunk - Callback for each chunk (content: string)
 * @param {Function} onComplete - Callback when stream completes (fullContent: string)
 * @param {Function} onError - Callback for errors
 * @param {AbortSignal} signal - Abort signal for cancellation
 * @returns {Promise<string>} - Full response content
 */
export async function streamGenerate(
  userInput,
  { onChunk, onComplete, onError, signal, conversationHistory = [] } = {}
) {
  return new Promise((resolve, reject) => {
    let fullContent = "";
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    const attemptStream = () => {
      try {
        const url = `${API_BASE_URL}/api/generate`;
        const payload = { 
          userInput, 
          stream: true,
          conversationHistory: conversationHistory || [],
        };
        console.log("streamGenerate: Sending request", { url, payload: { ...payload, conversationHistory: conversationHistory?.length || 0 } });
        
        // Use fetch with ReadableStream for SSE (EventSource doesn't support POST)
        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal,
        })
          .then(async (response) => {
            console.log("streamGenerate: Received response", { 
              status: response.status, 
              statusText: response.statusText,
              ok: response.ok 
            });
            
            if (!response.ok) {
              const errorText = await response.text().catch(() => "");
              console.error("streamGenerate: Response error", { 
                status: response.status, 
                statusText: response.statusText,
                body: errorText 
              });
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            if (!response.body) {
              console.error("streamGenerate: Response body is null");
              throw new Error("Response body is null");
            }
            
            console.log("streamGenerate: Starting to read stream");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                // Stream complete
                if (onComplete) {
                  onComplete(fullContent);
                }
                resolve(fullContent);
                break;
              }

              // Decode chunk
              buffer += decoder.decode(value, { stream: true });
              
              // Process complete SSE messages
              const lines = buffer.split("\n");
              buffer = lines.pop() || ""; // Keep incomplete line in buffer

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const dataStr = line.slice(6).trim();
                  
                  if (dataStr === "[DONE]") {
                    if (onComplete) {
                      onComplete(fullContent);
                    }
                    resolve(fullContent);
                    return;
                  }

                  try {
                    const data = JSON.parse(dataStr);
                    
                    if (data.error) {
                      const error = new Error(data.error);
                      if (onError) onError(error);
                      reject(error);
                      return;
                    }

                    if (data.content) {
                      fullContent += data.content;
                      if (onChunk) {
                        onChunk(data.content);
                      }
                    }
                  } catch (parseError) {
                    // Ignore parse errors for malformed JSON
                    console.warn("Failed to parse SSE data:", dataStr);
                  }
                }
              }
            }
          })
          .catch((error) => {
            if (error.name === "AbortError") {
              // Request was cancelled
              if (eventSource) eventSource.close();
              reject(error);
              return;
            }

            // Retry logic
            if (retryCount < maxRetries) {
              retryCount++;
              console.warn(`Stream error, retrying (${retryCount}/${maxRetries})...`, error);
              
              setTimeout(() => {
                attemptStream();
              }, retryDelay * retryCount); // Exponential backoff
            } else {
              console.error("Stream failed after retries:", error);
              if (onError) onError(error);
              reject(error);
            }
          });
      } catch (error) {
        if (onError) onError(error);
        reject(error);
      }
    };

    attemptStream();
  });
}

/**
 * Stream AI modification response
 * @param {string} userInput - User's modification request
 * @param {Object} currentFiles - Current project files
 * @param {Object} options - Streaming options
 * @returns {Promise<string>} - Full response content
 */
export async function streamModify(
  userInput,
  currentFiles,
  { onChunk, onComplete, onError, signal, conversationHistory = [] } = {}
) {
  return new Promise((resolve, reject) => {
    let fullContent = "";
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000;

    const attemptStream = () => {
      const url = `${API_BASE_URL}/api/modify`;
      const payload = { 
        userInput, 
        currentFiles, 
        stream: true,
        conversationHistory: conversationHistory || [],
      };
      console.log("streamModify: Sending request", { url, payload: { ...payload, currentFiles: Object.keys(currentFiles || {}), conversationHistory: conversationHistory?.length || 0 } });
      
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal,
      })
        .then(async (response) => {
          console.log("streamModify: Received response", { 
            status: response.status, 
            statusText: response.statusText,
            ok: response.ok 
          });
          
          if (!response.ok) {
            const errorText = await response.text().catch(() => "");
            console.error("streamModify: Response error", { 
              status: response.status, 
              statusText: response.statusText,
              body: errorText 
            });
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          if (!response.body) {
            console.error("streamModify: Response body is null");
            throw new Error("Response body is null");
          }
          
          console.log("streamModify: Starting to read stream");

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              if (onComplete) {
                onComplete(fullContent);
              }
              resolve(fullContent);
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const dataStr = line.slice(6).trim();
                
                if (dataStr === "[DONE]") {
                  if (onComplete) {
                    onComplete(fullContent);
                  }
                  resolve(fullContent);
                  return;
                }

                try {
                  const data = JSON.parse(dataStr);
                  
                  if (data.error) {
                    const error = new Error(data.error);
                    if (onError) onError(error);
                    reject(error);
                    return;
                  }

                  if (data.content) {
                    fullContent += data.content;
                    if (onChunk) {
                      onChunk(data.content);
                    }
                  }
                } catch (parseError) {
                  console.warn("Failed to parse SSE data:", dataStr);
                }
              }
            }
          }
        })
        .catch((error) => {
          if (error.name === "AbortError") {
            reject(error);
            return;
          }

          if (retryCount < maxRetries) {
            retryCount++;
            console.warn(`Stream error, retrying (${retryCount}/${maxRetries})...`, error);
            setTimeout(() => {
              attemptStream();
            }, retryDelay * retryCount);
          } else {
            console.error("Stream failed after retries:", error);
            if (onError) onError(error);
            reject(error);
          }
        });
    };

    attemptStream();
  });
}

