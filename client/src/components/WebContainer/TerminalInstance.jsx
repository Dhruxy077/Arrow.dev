// src/components/WebContainer/TerminalInstance.jsx

import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import { FitAddon } from "xterm-addon-fit";

// 1. ACCEPT THE PROP
const TerminalInstance = ({ webcontainerInstance, isContainerReady }) => {
  const terminalRef = useRef(null);

  // 2. ADD `isContainerReady` TO THE DEPENDENCY ARRAY
  useEffect(() => {
    // 3. ADD A CHECK FOR THE READY STATE
    if (!webcontainerInstance || !terminalRef.current || !isContainerReady)
      return;

    const fitAddon = new FitAddon();
    const terminal = new Terminal({
      convertEol: true,
      cursorBlink: true,
      theme: { background: "#000000" },
    });
    terminal.loadAddon(fitAddon);
    terminal.open(terminalRef.current);
    terminal.write("Welcome to the interactive shell!\n");
    fitAddon.fit();

    const startShell = async () => {
      const shellProcess = await webcontainerInstance.spawn("jsh", {
        terminal: {
          cols: terminal.cols,
          rows: terminal.rows,
        },
      });

      shellProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            terminal.write(data);
          },
        })
      );

      const input = shellProcess.input.getWriter();
      const dataListener = terminal.onData((data) => {
        input.write(data);
      });

      const resizeListener = terminal.onResize(({ cols, rows }) => {
        shellProcess.resize({ cols, rows });
      });

      return () => {
        dataListener.dispose();
        resizeListener.dispose();
      };
    };

    const cleanupPromise = startShell();

    return () => {
      cleanupPromise.then((cleanup) => cleanup && cleanup());
    };
  }, [webcontainerInstance, isContainerReady]);

  return <div ref={terminalRef} className="w-full h-full" />;
};

export default TerminalInstance;
