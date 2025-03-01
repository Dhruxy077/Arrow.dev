// WebContainer.js/webcontainerService.js
import { WebContainer } from "@webcontainer/api";

class WebContainerService {
  constructor() {
    this.webcontainerInstance = null;
    this.isInitialized = false;
    this.shell = null;
    this.eventListeners = {
      ready: [],
      terminalOutput: [],
      serverStarted: [],
    };
  }

  // Boot the WebContainer
  async boot() {
    if (this.isInitialized) return;

    try {
      // Initialize the WebContainer
      this.webcontainerInstance = await WebContainer.boot();
      this.isInitialized = true;

      // Trigger ready event
      this._triggerEvent("ready");

      return this.webcontainerInstance;
    } catch (error) {
      console.error("Failed to boot WebContainer:", error);
      throw error;
    }
  }

  // Start an interactive shell
  async startShell() {
    if (!this.isInitialized) {
      throw new Error("WebContainer is not initialized");
    }

    try {
      // Start a shell process
      this.shell = await this.webcontainerInstance.spawn("jsh", {
        terminal: {
          cols: 80,
          rows: 30,
        },
      });

      // Forward terminal output events
      this.shell.output.pipeTo(
        new WritableStream({
          write: (data) => {
            this._triggerEvent("terminalOutput", data);
          },
        })
      );

      return this.shell;
    } catch (error) {
      console.error("Failed to start shell:", error);
      throw error;
    }
  }

  // Write input to the shell
  writeInput(data) {
    if (this.shell && this.shell.input) {
      this.shell.input.write(data);
    }
  }

  // Write files to the WebContainer
  async writeFiles(files) {
    if (!this.isInitialized) {
      throw new Error("WebContainer is not initialized");
    }

    try {
      await this.webcontainerInstance.mount(files);
    } catch (error) {
      console.error("Failed to write files:", error);
      throw error;
    }
  }

  // Write a single file
  async writeFile(path, content) {
    if (!this.isInitialized) {
      throw new Error("WebContainer is not initialized");
    }

    try {
      await this.webcontainerInstance.fs.writeFile(path, content);
    } catch (error) {
      console.error(`Failed to write file ${path}:`, error);
      throw error;
    }
  }

  // Run a command
  async runCommand(command, args = []) {
    if (!this.isInitialized) {
      throw new Error("WebContainer is not initialized");
    }

    try {
      const process = await this.webcontainerInstance.spawn(command, args);
      const output = [];

      process.output.pipeTo(
        new WritableStream({
          write: (data) => {
            output.push(data);
            this._triggerEvent("terminalOutput", data);
          },
        })
      );

      const exitCode = await process.exit;
      return { exit: exitCode, output: output.join("") };
    } catch (error) {
      console.error("Failed to run command:", error);
      throw error;
    }
  }

  // Install dependencies
  async installDependencies() {
    if (!this.isInitialized) {
      throw new Error("WebContainer is not initialized");
    }

    try {
      const installProcess = await this.webcontainerInstance.spawn("npm", [
        "install",
      ]);

      installProcess.output.pipeTo(
        new WritableStream({
          write: (data) => {
            this._triggerEvent("terminalOutput", data);
          },
        })
      );

      return installProcess.exit;
    } catch (error) {
      console.error("Failed to install dependencies:", error);
      throw error;
    }
  }

  // Start a dev server
  async startDevServer(command, args, port) {
    if (!this.isInitialized) {
      throw new Error("WebContainer is not initialized");
    }

    try {
      // Start the server process
      const serverProcess = await this.webcontainerInstance.spawn(
        command,
        args
      );

      // Forward output to terminal
      serverProcess.output.pipeTo(
        new WritableStream({
          write: (data) => {
            this._triggerEvent("terminalOutput", data);
          },
        })
      );

      // Wait for the server to be ready by polling the port
      const url = await this._waitForServer(port);

      // Trigger serverStarted event
      this._triggerEvent("serverStarted", url);

      return url;
    } catch (error) {
      console.error("Failed to start dev server:", error);
      throw error;
    }
  }

  // Wait for server to be ready
  async _waitForServer(port) {
    if (!this.isInitialized) {
      throw new Error("WebContainer is not initialized");
    }

    // The base URL for WebContainer
    const url = `http://localhost:${port}`;

    // Wait for the server to be ready
    await this.webcontainerInstance.waitForPort(port);

    return url;
  }

  // Event handling
  addEventListener(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].push(callback);
    }
  }

  removeEventListener(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(
        (cb) => cb !== callback
      );
    }
  }

  _triggerEvent(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach((callback) => callback(data));
    }
  }
}

// Create a singleton instance
const webContainerService = new WebContainerService();
export default webContainerService;
