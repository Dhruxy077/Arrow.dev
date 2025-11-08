// client/services/WebContainerService.js
import { WebContainer } from "@webcontainer/api";

export class WebContainerService {
  constructor() {
    this.container = null;
    this.bootPromise = null;
    this.npmReadyPromise = null;
    this.statusListeners = new Set();
    this.errorListeners = new Set();
    this.terminalListeners = new Set(); // <-- NEW: For build logs
    this.serverProcesses = new Map();
    this.maxRetries = 3;
  }

  // --- NEW: Terminal Listener Methods ---
  addTerminalListener(listener) {
    this.terminalListeners.add(listener);
  }
  removeTerminalListener(listener) {
    this.terminalListeners.delete(listener);
  }
  writeToTerminal(data) {
    this.terminalListeners.forEach((listener) => listener(data));
  }
  // --- END NEW ---

  addStatusListener(listener) {
    this.statusListeners.add(listener);
  }
  // ... (removeStatusListener, addErrorListener, removeErrorListener, updateStatus, notifyError are unchanged) ...
  removeStatusListener(listener) {
    this.statusListeners.delete(listener);
  }

  addErrorListener(listener) {
    this.errorListeners.add(listener);
  }

  removeErrorListener(listener) {
    this.errorListeners.delete(listener);
  }

  updateStatus(status, progress = 0) {
    this.statusListeners.forEach((listener) => listener({ status, progress }));
  }

  notifyError(error) {
    this.errorListeners.forEach((listener) => listener(error));
  }

  // ... (initialize, _bootWithRetries, _waitForNpm, writeFiles, groupFilesByDirectory, extractFileContent are unchanged) ...
  async initialize(options = {}) {
    if (this.container) {
      this.updateStatus("WebContainer already initialized", 33);
      return this.container;
    }
    if (this.bootPromise) {
      this.updateStatus("Waiting for existing boot process...", 10);
      return this.bootPromise;
    }
    this.bootPromise = this._bootWithRetries();
    this.bootPromise.catch((err) => {
      console.error("Boot process failed, resetting boot promise.", err);
      this.bootPromise = null;
    });
    return this.bootPromise;
  }

  async _bootWithRetries() {
    let attempt = 0;
    let lastError = null;
    
    // Check if WebContainer is supported
    if (typeof WebContainer === "undefined") {
      const error = new Error(
        "WebContainer is not supported in this browser. Please use Chrome, Edge, or another Chromium-based browser."
      );
      this.notifyError(error);
      throw error;
    }

    while (attempt < this.maxRetries) {
      try {
        this.updateStatus(
          `Initializing WebContainer (attempt ${attempt + 1}/${
            this.maxRetries
          })...`,
          (attempt / this.maxRetries) * 33
        );
        
        // Add timeout to boot process
        const bootPromise = WebContainer.boot();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("WebContainer boot timeout")), 30000)
        );
        
        const container = await Promise.race([bootPromise, timeoutPromise]);
        
        if (!container) {
          throw new Error("WebContainer boot returned null");
        }

        this.container = container;
        this.updateStatus("WebContainer initialized successfully", 33);
        
        // Start npm ready check in background
        this.npmReadyPromise = this._waitForNpm().catch((err) => {
          console.warn("npm ready check failed:", err);
          // Don't throw - npm might still work
        });
        
        return container;
      } catch (error) {
        lastError = error;
        console.error(
          `WebContainer initialization attempt ${attempt + 1} failed:`,
          error
        );
        attempt++;
        
        if (attempt < this.maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          this.updateStatus(
            `Retrying in ${delay / 1000}s...`,
            (attempt / this.maxRetries) * 33
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    
    const error = new Error(
      `WebContainer initialization failed after ${this.maxRetries} attempts: ${lastError?.message || "Unknown error"}`
    );
    error.originalError = lastError;
    this.notifyError(error);
    throw error;
  }

  async _waitForNpm() {
    if (!this.container) {
      throw new Error("WebContainer not initialized");
    }
    
    this.updateStatus("Waiting for npm to be ready...", 60);
    this.writeToTerminal("Waiting for npm to be ready...\r\n");
    
    const maxAttempts = 30; // 30 seconds max
    let attempts = 0;
    
    return new Promise((resolve, reject) => {
      const trySpawn = async () => {
        attempts++;
        
        if (attempts > maxAttempts) {
          const error = new Error("npm readiness check timeout");
          this.notifyError(error);
          reject(error);
          return;
        }

        try {
          const process = await this.container.spawn("npm", ["--version"]);
          
          // Set timeout for process
          const timeout = setTimeout(() => {
            process.kill();
            this.writeToTerminal("npm version check timed out, retrying...\r\n");
            setTimeout(trySpawn, 1000);
          }, 5000);

          process.output.pipeTo(
            new WritableStream({
              write: (data) => this.writeToTerminal(data),
            })
          );
          
          const exitCode = await process.exit;
          clearTimeout(timeout);
          
          if (exitCode === 0) {
            this.writeToTerminal("npm is ready!\r\n");
            this.updateStatus("npm is ready", 65);
            resolve();
          } else {
            this.writeToTerminal(
              `npm check failed with code ${exitCode}, retrying...\r\n`
            );
            setTimeout(trySpawn, 1000);
          }
        } catch (err) {
          this.writeToTerminal(
            `npm spawn error: ${err.message}, retrying...\r\n`
          );
          setTimeout(trySpawn, 1000);
        }
      };
      
      trySpawn();
    });
  }

  async writeFiles(files) {
    if (!this.container) {
      throw new Error("WebContainer not initialized");
    }
    const totalFiles = Object.keys(files).length;
    if (totalFiles === 0) {
      this.updateStatus("No files to write", 33);
      return;
    }
    
    let processedFiles = 0;
    try {
      const filesByDirectory = this.groupFilesByDirectory(files);
      
      // Create all directories first
      const directories = Object.keys(filesByDirectory).filter(dir => dir !== ".");
      for (const directory of directories) {
        try {
          await this.container.fs.mkdir(directory, { recursive: true });
        } catch (error) {
          // Directory might already exist, ignore
          if (!error.message.includes("EEXIST")) {
            console.warn(`Error creating directory ${directory}:`, error);
          }
        }
      }
      
      // Write all files
      for (const [directory, dirFiles] of Object.entries(filesByDirectory)) {
        for (const [filename, fileData] of Object.entries(dirFiles)) {
          try {
            const content = this.extractFileContent(fileData);
            await this.container.fs.writeFile(filename, content);
            processedFiles++;
            this.updateStatus(
              `Writing files (${processedFiles}/${totalFiles})...`,
              33 + (processedFiles / totalFiles) * 33
            );
          } catch (error) {
            console.error(`Error writing file ${filename}:`, error);
            this.notifyError(error);
            // Continue with other files even if one fails
          }
        }
      }
      
      this.updateStatus(`Successfully wrote ${processedFiles} files`, 66);
    } catch (error) {
      this.notifyError(error);
      throw error;
    }
  }

  groupFilesByDirectory(files) {
    const groups = {};
    for (const [path, content] of Object.entries(files)) {
      const parts = path.split("/");
      const filename = parts.pop();
      const directory = parts.length ? parts.join("/") : ".";
      if (!groups[directory]) {
        groups[directory] = {};
      }
      groups[directory][path] = content;
    }
    return groups;
  }

  extractFileContent(fileData) {
    if (typeof fileData === "string") {
      return fileData;
    }
    if (fileData?.content) {
      return fileData.content;
    }
    if (fileData?.file?.contents) {
      return fileData.file.contents;
    }
    return JSON.stringify(fileData, null, 2);
  }

  async installDependencies(packageJsonContent) {
    if (!this.container) {
      throw new Error("WebContainer not initialized");
    }
    await this.npmReadyPromise;

    try {
      const packageJson = JSON.parse(packageJsonContent);
      const hasDependencies =
        packageJson.dependencies || packageJson.devDependencies;

      if (!hasDependencies) {
        this.updateStatus("No dependencies to install", 66);
        this.writeToTerminal("No dependencies to install.\r\n"); // <-- NEW
        return;
      }

      this.updateStatus("Installing dependencies...", 66);
      this.writeToTerminal("\r\n\x1b[1;36m> npm install\x1b[0m\r\n"); // <-- NEW

      const installProcess = await this.container.spawn("npm", ["install"]);

      await new Promise((resolve, reject) => {
        installProcess.output.pipeTo(
          new WritableStream({
            write: (data) => {
              this.writeToTerminal(data); // <-- MODIFIED
              if (data.includes("idealTree")) {
                this.updateStatus("Calculating dependency tree...", 70);
              } else if (data.includes("reify")) {
                this.updateStatus("Downloading packages...", 80);
              }
            },
          })
        );

        installProcess.exit.then((code) => {
          if (code !== 0) {
            const error = new Error(`npm install failed with code ${code}`);
            this.notifyError(error);
            this.writeToTerminal(
              `\r\n\x1b[1;31mError: npm install failed with code ${code}\x1b[0m\r\n`
            ); // <-- NEW
            reject(error);
          } else {
            this.writeToTerminal(
              "\r\n\x1b[1;32mDependencies installed successfully!\x1b[0m\r\n"
            ); // <-- NEW
            resolve();
          }
        });
      });

      this.updateStatus("Dependencies installed successfully", 90);
    } catch (error) {
      this.notifyError(error);
      throw error;
    }
  }

  async startDevServer() {
    if (!this.container) {
      throw new Error("WebContainer not initialized");
    }
    await this.npmReadyPromise;

    this.updateStatus("Starting development server...", 90);
    this.writeToTerminal("\r\n\x1b[1;36m> npm run dev\x1b[0m\r\n"); // <-- NEW

    const serverProcess = await this.container.spawn("npm", ["run", "dev"]);
    this.serverProcesses.set("dev", serverProcess);

    serverProcess.output.pipeTo(
      new WritableStream({
        write: (data) => {
          this.writeToTerminal(data); // <-- MODIFIED
        },
      })
    );

    return new Promise((resolve, reject) => {
      this.container.on("server-ready", (port, url) => {
        this.updateStatus("Development server running", 100);
        this.writeToTerminal(
          `\r\n\x1b[1;32mServer is ready at: ${url}\x1b[0m\r\n`
        ); // <-- NEW
        resolve(url);
      });
      serverProcess.exit.then((code) => {
        if (code !== 0) {
          const error = new Error(`Dev server failed with code ${code}`);
          this.notifyError(error);
          this.writeToTerminal(
            `\r\n\x1b[1;31mError: Dev server failed with code ${code}\x1b[0m\r\n`
          ); // <-- NEW
          reject(error);
        }
      });
    });
  }

  // ... (stopAllProcesses and cleanup are unchanged) ...
  async stopAllProcesses() {
    for (const [name, process] of this.serverProcesses.entries()) {
      try {
        await process.kill();
      } catch (error) {
        console.error(`Error stopping ${name} process:`, error);
      }
    }
    this.serverProcesses.clear();
  }

  async cleanup() {
    try {
      await this.stopAllProcesses();
      if (this.container) {
        await this.container.teardown();
        this.container = null;
      }
      this.bootPromise = null;
      this.npmReadyPromise = null;
      this.statusListeners.clear();
      this.errorListeners.clear();
      this.terminalListeners.clear(); // <-- NEW
    } catch (error) {
      console.error("Error during WebContainer cleanup:", error);
    }
  }
}

export const webContainerService = new WebContainerService();
