// client/src/components/WebContainer/TerminalInstance.jsx
import React, { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";

const TerminalInstance = ({
  webcontainerInstance,
  isContainerReady,
  terminalId,
  cwd = "~/project",
}) => {
  const terminalRef = useRef(null);
  const terminalInstanceRef = useRef(null);
  const shellProcessRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const isInitializedRef = useRef(false);
  const commandHistoryRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const currentLineRef = useRef("");

  useEffect(() => {
    if (!webcontainerInstance || !terminalRef.current || !isContainerReady) {
      return;
    }

    if (isInitializedRef.current) return;

    const initTerminal = async () => {
      try {
        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();

        const terminal = new Terminal({
          convertEol: true,
          cursorBlink: true,
          fontFamily:
            '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
          fontSize: 14,
          lineHeight: 1.2,
          theme: {
            background: "#1e1e1e",
            foreground: "#d4d4d4",
            cursor: "#aeafad",
            selection: "#264f78",
            black: "#000000",
            red: "#cd3131",
            green: "#0dbc79",
            yellow: "#e5e510",
            blue: "#2472c8",
            magenta: "#bc3fbc",
            cyan: "#11a8cd",
            white: "#e5e5e5",
            brightBlack: "#666666",
            brightRed: "#f14c4c",
            brightGreen: "#23d18b",
            brightYellow: "#f5f543",
            brightBlue: "#3b8eea",
            brightMagenta: "#d670d6",
            brightCyan: "#29b8db",
            brightWhite: "#e5e5e5",
          },
          allowTransparency: true,
          scrollback: 1000,
        });

        terminal.loadAddon(fitAddon);
        terminal.loadAddon(webLinksAddon);
        terminal.open(terminalRef.current);
        terminal.focus();
        terminalInstanceRef.current = terminal;

        // Fit terminal to container
        fitAddon.fit();

        // Handle window resize
        const resizeObserver = new ResizeObserver(() => {
          if (terminal.element) {
            fitAddon.fit();
          }
        });
        resizeObserver.observe(terminalRef.current);
        resizeObserverRef.current = resizeObserver;

        // Write welcome message and prompt
        terminal.writeln("\x1b[1;36mTerminal Ready\x1b[0m");
        terminal.write(`\r\n${cwd} \x1b[1;32m> \x1b[0m`);

        // Start shell process
        const shellProcess = await webcontainerInstance.spawn("jsh", {
          terminal: {
            cols: terminal.cols,
            rows: terminal.rows,
          },
        });

        shellProcessRef.current = shellProcess;

        // Pipe shell output to terminal
        shellProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              if (terminal.element) {
                terminal.write(data);
              }
            },
          })
        );

        // Handle terminal input with command history
        const input = shellProcess.input.getWriter();
        let currentCommand = "";
        let historyIndex = -1;
        let savedLine = "";

        const dataListener = terminal.onData((data) => {
          if (!terminal.element) return;

          // Handle Ctrl+C (interrupt)
          if (data === "\x03") {
            currentCommand = "";
            historyIndex = -1;
            savedLine = "";
            input.write(data);
            return;
          }

          // Handle Ctrl+L (clear screen)
          if (data === "\x0c") {
            terminal.clear();
            input.write(data);
            return;
          }

          // Handle Ctrl+U (clear line)
          if (data === "\x15") {
            currentCommand = "";
            historyIndex = -1;
            input.write(data);
            return;
          }

          // Handle arrow keys for command history
          if (data === "\x1b[A") {
            // Up arrow - previous command
            if (commandHistoryRef.current.length > 0) {
              if (historyIndex === -1) {
                // Save current line if at end of history
                savedLine = currentCommand;
              }
              historyIndex = Math.min(commandHistoryRef.current.length - 1, historyIndex + 1);
              const command = commandHistoryRef.current[commandHistoryRef.current.length - 1 - historyIndex];
              currentCommand = command;
              
              // Clear current line and write command
              terminal.write("\r\x1b[K"); // Clear line
              terminal.write(`${cwd} \x1b[1;32m> \x1b[0m${command}`);
            }
            return;
          } else if (data === "\x1b[B") {
            // Down arrow - next command
            if (historyIndex > 0) {
              historyIndex = historyIndex - 1;
              const command = commandHistoryRef.current[commandHistoryRef.current.length - 1 - historyIndex];
              currentCommand = command;
              
              // Clear current line and write command
              terminal.write("\r\x1b[K"); // Clear line
              terminal.write(`${cwd} \x1b[1;32m> \x1b[0m${command}`);
            } else if (historyIndex === 0) {
              // Restore original line
              currentCommand = savedLine;
              historyIndex = -1;
              savedLine = "";
              
              // Clear current line and write saved line
              terminal.write("\r\x1b[K"); // Clear line
              terminal.write(`${cwd} \x1b[1;32m> \x1b[0m${savedLine}`);
            }
            return;
          } else if (data === "\r") {
            // Enter key - execute command
            if (currentCommand.trim()) {
              // Add to history (avoid duplicates)
              const trimmed = currentCommand.trim();
              commandHistoryRef.current = commandHistoryRef.current.filter(c => c !== trimmed);
              commandHistoryRef.current.push(trimmed);
              // Keep only last 100 commands
              if (commandHistoryRef.current.length > 100) {
                commandHistoryRef.current.shift();
              }
              historyIndex = -1;
              savedLine = "";
            }
            currentCommand = "";
            input.write(data);
            return;
          } else if (data === "\x7f" || data === "\b") {
            // Backspace
            if (currentCommand.length > 0) {
              currentCommand = currentCommand.slice(0, -1);
            }
            historyIndex = -1; // Reset history when typing
            input.write(data);
            return;
          } else if (data.length === 1 && data >= " " && data <= "~") {
            // Printable characters
            currentCommand += data;
            historyIndex = -1; // Reset history when typing
            input.write(data);
            return;
          }

          // Send all other data to shell
          input.write(data);
        });

        // Handle terminal resize
        const resizeListener = terminal.onResize(({ cols, rows }) => {
          if (shellProcessRef.current) {
            shellProcessRef.current.resize({ cols, rows });
          }
        });

        // Cleanup function
        const cleanup = () => {
          if (dataListener) dataListener.dispose();
          if (resizeListener) resizeListener.dispose();
          if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
          if (shellProcessRef.current) {
            shellProcessRef.current.kill();
          }
          if (terminalInstanceRef.current) {
            terminalInstanceRef.current.dispose();
          }
        };

        isInitializedRef.current = true;
        // Store cleanup for unmount
        return cleanup;
      } catch (error) {
        console.error("Error initializing terminal:", error);
        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.writeln(
            "\r\n\x1b[1;31m===================================\r\n"
          );
          terminalInstanceRef.current.writeln(
            "\x1b[1;31mCRITICAL TERMINAL ERROR:\r\n"
          );
          terminalInstanceRef.current.writeln(
            `\x1b[1;33m${error.message}\x1b[0m`
          );
          terminalInstanceRef.current.writeln(
            "\x1b[1;31m===================================\r\n"
          );
        }
        isInitializedRef.current = false;
      }
    };

    const cleanupFn = initTerminal();

    return () => {
      isInitializedRef.current = false;
      if (typeof cleanupFn === "function") {
        cleanupFn();
      }
    };
  }, [webcontainerInstance, isContainerReady, terminalId, cwd]);

  // Expose terminal instance and methods via ref (for parent components)
  useEffect(() => {
    if (terminalInstanceRef.current && shellProcessRef.current) {
      // Expose executeCommand method for programmatic command execution
      if (terminalInstanceRef.current.executeCommand === undefined) {
        terminalInstanceRef.current.executeCommand = async (command) => {
          if (shellProcessRef.current && command) {
            const input = shellProcessRef.current.input.getWriter();
            // Add command to history
            const trimmed = command.trim();
            if (trimmed) {
              commandHistoryRef.current = commandHistoryRef.current.filter(c => c !== trimmed);
              commandHistoryRef.current.push(trimmed);
              if (commandHistoryRef.current.length > 100) {
                commandHistoryRef.current.shift();
              }
            }
            // Write command and execute
            input.write(command + "\r");
            return shellProcessRef.current;
          }
        };
      }
    }
  }, [terminalInstanceRef.current, shellProcessRef.current]);

  // Store terminal instance reference on DOM element for external access
  useEffect(() => {
    if (terminalRef.current && terminalInstanceRef.current) {
      terminalRef.current._terminalInstance = terminalInstanceRef.current;
      terminalRef.current.setAttribute("data-terminal-id", terminalId);
    }
  }, [terminalInstanceRef.current, terminalId]);

  return (
    <div
      ref={terminalRef}
      className="w-full h-full bg-neutral-900 overflow-hidden"
      style={{ minHeight: "200px" }}
      data-terminal-id={terminalId}
      onClick={() => {
        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.focus();
        }
      }}
    />
  );
};

export default TerminalInstance;
