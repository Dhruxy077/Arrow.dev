import React, { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import { FitAddon } from "xterm-addon-fit";

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
        const terminal = new Terminal({
          convertEol: true,
          cursorBlink: true,
          fontFamily:
            '"Cascadia Code", "Fira Code", "JetBrains Mono", Consolas, monospace',
          fontSize: 14,
          theme: {
            background: "#000000",
            foreground: "#ffffff",
            cursor: "#ffffff",
            selection: "#ffffff33",
          },
          allowTransparency: true,
        });

        terminal.loadAddon(fitAddon);
        terminal.open(terminalRef.current);
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

        terminal.writeln("WebContainer Terminal Ready");
        terminal.write("$ ");

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
            "Error starting terminal: " + error.message
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
      className="w-full h-full bg-black"
      style={{ minHeight: "200px" }}
    />
  );
};

export default TerminalInstance;
