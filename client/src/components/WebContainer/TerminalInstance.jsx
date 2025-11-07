import React, { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import { SearchAddon } from "xterm-addon-search";

const TerminalInstance = ({
  webcontainerInstance,
  isContainerReady,
  terminalId,
}) => {
  const terminalRef = useRef(null);
  const terminalInstanceRef = useRef(null);
  const shellProcessRef = useRef(null);
  const cleanupRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const commandHistoryRef = useRef([]);
  const historyIndexRef = useRef(-1);

  useEffect(() => {
    if (!webcontainerInstance || !terminalRef.current || !isContainerReady) {
      return;
    }

    // Prevent multiple initializations
    if (isInitialized) return;
    setIsInitialized(true);

    const initTerminal = async () => {
      try {
        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();
        const searchAddon = new SearchAddon();

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
          scrollback: 1000, // Limit buffer size for performance
        });

        terminal.loadAddon(fitAddon);
        terminal.loadAddon(webLinksAddon);
        terminal.loadAddon(searchAddon);
        terminal.open(terminalRef.current);
        terminal.focus();
        terminalInstanceRef.current = terminal;

        // Fit terminal to container
        fitAddon.fit();

        // Handle window resize
        const resizeObserver = new ResizeObserver(() => {
          fitAddon.fit();
        });

        if (terminalRef.current) {
          resizeObserver.observe(terminalRef.current);
        }

        terminal.writeln("\x1b[1;36mWebContainer Terminal Ready\x1b[0m");
        terminal.write("\x1b[1;32m$ \x1b[0m");

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
              terminal.write(data);
            },
          })
        );

        // Handle terminal input
        const input = shellProcess.input.getWriter();
        const dataListener = terminal.onData((data) => {
          // Handle command history navigation
          if (data === "\x1b[A") {
            // Up arrow
            if (commandHistoryRef.current.length > 0) {
              if (historyIndexRef.current < 0) {
                historyIndexRef.current = commandHistoryRef.current.length - 1;
              } else if (historyIndexRef.current > 0) {
                historyIndexRef.current--;
              }

              // Get current line content (after $ prompt)
              const buffer = terminal.buffer.active;
              const currentLine = buffer.getLine(buffer.cursorY).toString();
              const promptEnd = currentLine.indexOf("$") + 2;
              const currentCommand = currentLine.substring(promptEnd);

              // Clear current line and write history command
              terminal.write(
                "\r\x1b[K\x1b[1;32m$ \x1b[0m" +
                  commandHistoryRef.current[historyIndexRef.current]
              );
            }
            return;
          } else if (data === "\x1b[B") {
            // Down arrow
            if (commandHistoryRef.current.length > 0) {
              if (
                historyIndexRef.current <
                commandHistoryRef.current.length - 1
              ) {
                historyIndexRef.current++;
                const command =
                  commandHistoryRef.current[historyIndexRef.current];
                terminal.write("\r\x1b[K\x1b[1;32m$ \x1b[0m" + command);
              } else {
                historyIndexRef.current = commandHistoryRef.current.length;
                terminal.write("\r\x1b[K\x1b[1;32m$ \x1b[0m");
              }
            }
            return;
          }

          // Reset history index on new command input
          if (data !== "\r" && data !== "\n") {
            historyIndexRef.current = commandHistoryRef.current.length;
          }

          // Handle Enter key - add to history
          if (data === "\r" || data === "\n") {
            const buffer = terminal.buffer.active;
            const currentLine = buffer.getLine(buffer.cursorY - 1).toString();
            const promptEnd = currentLine.indexOf("$") + 2;
            const command = currentLine.substring(promptEnd).trim();

            if (command) {
              commandHistoryRef.current.push(command);
              historyIndexRef.current = commandHistoryRef.current.length;
            }
          }

          input.write(data);
        });

        // Handle terminal resize
        const resizeListener = terminal.onResize(({ cols, rows }) => {
          shellProcess.resize({ cols, rows });
        });

        // Store cleanup function
        cleanupRef.current = () => {
          dataListener.dispose();
          resizeListener.dispose();
          resizeObserver.disconnect();
          if (shellProcessRef.current) {
            shellProcessRef.current.kill();
          }
          if (terminalInstanceRef.current) {
            terminalInstanceRef.current.dispose();
          }
        };
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
      }
    };

    initTerminal();

    // Cleanup function
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [webcontainerInstance, isContainerReady, terminalId, isInitialized]);

  return (
    <div
      ref={terminalRef}
      className="w-full h-full bg-gray-900"
      style={{ minHeight: "200px" }}
      // --- ADD THIS ONCLICK HANDLER ---
      onClick={() => {
        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.focus();
        }
      }}
    />
  );
};

export default TerminalInstance;
