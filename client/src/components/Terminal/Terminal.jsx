import React, { useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "xterm";
import "xterm/css/xterm.css";
import { FitAddon } from "xterm-addon-fit";
import { Copy, Trash2 } from "lucide-react";
import { webContainerService } from "../../services/WebContainerService";

const Terminal = () => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const copyTerminalOutput = () => {
    if (xtermRef.current) {
      const buffer = xtermRef.current.buffer.active;
      let output = "";
      for (let i = 0; i < buffer.length; i++) {
        const line = buffer.getLine(i);
        if (line) {
          output += line.translateToString(true) + "\n";
        }
      }
      navigator.clipboard.writeText(output);
    }
  };

  const clearTerminal = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
      xtermRef.current.writeln("\x1b[1;36mTerminal cleared\x1b[0m");
    }
  };

  useEffect(() => {
    if (terminalRef.current && !xtermRef.current) {
      const term = new XTerm({
        convertEol: true,
        cursorBlink: false,
        rows: 10,
        theme: {
          background: "#0a0e1a",
          foreground: "#e2e8f0",
          cursor: "#e2e8f0",
          selection: "#404040",
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

      term.writeln(
        "\x1b[1;32mWelcome to Arrow.dev Terminal\x1b[0m"
      );
      term.writeln("\x1b[36mBuild logs will appear here...\x1b[0m\n");

      const listener = (data) => {
        term.write(data);
      };
      webContainerService.addTerminalListener(listener);

      const handleKeyDown = (e) => {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          const newIndex = Math.min(
            historyIndex + 1,
            commandHistory.length - 1
          );
          setHistoryIndex(newIndex);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          const newIndex = Math.max(historyIndex - 1, -1);
          setHistoryIndex(newIndex);
        }
      };

      term.onKey((event) => {
        handleKeyDown(event.domEvent);
      });

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
  }, [commandHistory, historyIndex]);

  return (
    <div className="flex flex-col h-full bg-neutral-900 text-white">
      <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-neutral-800 h-14">
        <h3 className="text-sm font-medium">Terminal</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={copyTerminalOutput}
            title="Copy output"
            className="p-2 text-neutral-400 hover:bg-neutral-800 rounded transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={clearTerminal}
            title="Clear terminal"
            className="p-2 text-neutral-400 hover:bg-neutral-800 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div ref={terminalRef} className="flex-1 w-full overflow-hidden p-2" />
    </div>
  );
};

export default Terminal;
