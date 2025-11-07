// client/components/Terminal.jsx
import React, { useEffect, useRef } from "react";
import { Terminal as XTerm } from "xterm";
import "xterm/css/xterm.css";
import { FitAddon } from "xterm-addon-fit";
import { webContainerService } from "../../services/WebContainerService";

const Terminal = () => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);

  useEffect(() => {
    if (terminalRef.current && !xtermRef.current) {
      const term = new XTerm({
        convertEol: true,
        cursorBlink: false,
        disableStdin: true, // Read-only
        rows: 10,
        theme: {
          background: "#171717", // bg-neutral-900
          foreground: "#a3a3a3", // text-neutral-400
          cursor: "#a3a3a3",
          selection: "#404040", // bg-neutral-700
        },
        fontSize: 13,
        fontFamily: "Menlo, Monaco, 'Courier New', monospace",
        allowTransparency: true,
      });
      const fitAddon = new FitAddon();

      xtermRef.current = term;
      fitAddonRef.current = fitAddon;

      term.loadAddon(fitAddon);
      term.open(terminalRef.current);
      fitAddon.fit();

      term.writeln("\x1b[1;36mWelcome to the Arrow.dev Build Terminal!\x1b[0m");
      term.writeln("Build logs will appear here...\r\n");

      // Subscribe to terminal logs
      const listener = (data) => {
        term.write(data);
      };
      webContainerService.addTerminalListener(listener);

      // Handle resize
      const resizeObserver = new ResizeObserver(() => {
        fitAddon.fit();
      });
      resizeObserver.observe(terminalRef.current);

      return () => {
        webContainerService.removeTerminalListener(listener);
        resizeObserver.disconnect();
        term.dispose();
      };
    }
  }, []);

  return (
    // The panel gives the padding, not the terminal itself
    <div ref={terminalRef} className="w-full h-full p-2" />
  );
};

export default Terminal;
