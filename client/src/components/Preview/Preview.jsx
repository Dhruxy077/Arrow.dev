// client/src/components/Preview/Preview.jsx
import React, { useState, useEffect, useRef } from "react";
import { Eye, Loader2, ExternalLink, AlertTriangle, X } from "lucide-react";

const Preview = ({ serverUrl, isServerRunning }) => {
  const [iframeHeight, setIframeHeight] = useState(0);
  const [errors, setErrors] = useState([]);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [showConsole, setShowConsole] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    // Calculate available height based on viewport
    const updateHeight = () => {
      const headerHeight = 56; // approx height of header + toggle bar
      const footerHeight = 0; // no footer
      const availableHeight = window.innerHeight - headerHeight - footerHeight;
      setIframeHeight(Math.max(400, availableHeight)); // Minimum 400px
    };

    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(document.body);
    window.addEventListener("resize", updateHeight);
    return () => {
      window.removeEventListener("resize", updateHeight);
      resizeObserver.disconnect();
    };
  }, []);

  // Capture console errors and logs from iframe
  useEffect(() => {
    if (!isServerRunning) return;

    const handleError = (event) => {
      setErrors((prev) => {
        // Avoid duplicate errors
        const errorKey = `${event.message}-${event.filename}-${event.lineno}`;
        if (prev.some(e => `${e.message}-${e.source}-${e.line}` === errorKey)) {
          return prev;
        }
        return [
          ...prev,
          {
            message: event.message || 'Unknown error',
            source: event.filename || 'Unknown',
            line: event.lineno || 0,
            timestamp: new Date().toISOString(),
          },
        ];
      });
    };

    const handleUnhandledRejection = (event) => {
      const reason = event.reason?.message || event.reason || 'Unknown error';
      setErrors((prev) => {
        const errorKey = `Unhandled Promise Rejection: ${reason}`;
        if (prev.some(e => e.message === errorKey)) {
          return prev;
        }
        return [
          ...prev,
          {
            message: `Unhandled Promise Rejection: ${reason}`,
            source: 'Promise',
            line: 0,
            timestamp: new Date().toISOString(),
          },
        ];
      });
    };

    // Capture iframe load events
    const iframe = iframeRef.current;
    if (iframe) {
      const handleIframeLoad = () => {
        // Clear errors on successful load
        setErrors([]);
      };

      const handleIframeError = () => {
        setErrors((prev) => [
          ...prev,
          {
            message: 'Failed to load iframe content',
            source: serverUrl || 'Unknown',
            line: 0,
            timestamp: new Date().toISOString(),
          },
        ]);
      };

      iframe.addEventListener('load', handleIframeLoad);
      iframe.addEventListener('error', handleIframeError);

      return () => {
        iframe.removeEventListener('load', handleIframeLoad);
        iframe.removeEventListener('error', handleIframeError);
      };
    }

    // Capture window errors (for same-origin iframes)
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [isServerRunning, serverUrl]);

  return (
    <div className="flex flex-col h-full bg-neutral-900 text-white">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between p-3 border-b border-neutral-800 h-14">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium">Preview</h3>
          {errors.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-red-900/30 border border-red-700 rounded text-xs text-red-300">
              <AlertTriangle className="w-3 h-3" />
              {errors.length} {errors.length === 1 ? 'error' : 'errors'}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {consoleLogs.length > 0 && (
            <button
              onClick={() => setShowConsole(!showConsole)}
              className="px-2 py-1 text-xs text-neutral-400 hover:text-white bg-neutral-800 rounded"
              title="Toggle console"
            >
              Console ({consoleLogs.length})
            </button>
          )}
          {isServerRunning && serverUrl && (
            <a
              href={serverUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-neutral-400 hover:bg-neutral-800 rounded transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Console Panel */}
      {showConsole && consoleLogs.length > 0 && (
        <div className="shrink-0 border-b border-neutral-800 bg-neutral-950 max-h-48 overflow-y-auto">
          <div className="p-2 flex items-center justify-between border-b border-neutral-800">
            <h4 className="text-xs font-medium text-neutral-400">Console</h4>
            <button
              onClick={() => setConsoleLogs([])}
              className="text-xs text-neutral-500 hover:text-neutral-300"
            >
              Clear
            </button>
          </div>
          <div className="p-2 space-y-1">
            {consoleLogs.slice(-50).map((log, idx) => (
              <div
                key={idx}
                className={`text-xs font-mono ${
                  log.type === 'error'
                    ? 'text-red-400'
                    : log.type === 'warn'
                    ? 'text-yellow-400'
                    : 'text-neutral-300'
                }`}
              >
                [{log.type.toUpperCase()}] {log.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Area */}
      <div className="flex-1 overflow-auto p-4 bg-neutral-950 relative">
        {errors.length > 0 && (
          <div className="absolute top-4 right-4 z-10 max-w-md">
            <div className="bg-red-900/90 border border-red-700 rounded-lg p-3 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-medium text-red-300">
                    Runtime Errors ({errors.length})
                  </span>
                </div>
                <button
                  onClick={() => setErrors([])}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {errors.map((error, idx) => (
                  <div key={idx} className="text-xs text-red-200 bg-red-950/50 p-2 rounded">
                    <div className="font-mono">{error.message}</div>
                    <div className="text-red-400/70 mt-1">
                      {error.source}:{error.line}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {isServerRunning && serverUrl ? (
          <div className="w-full h-full flex items-center justify-center">
            <div
              className="bg-white rounded-lg shadow-lg overflow-hidden border border-neutral-700 relative"
              style={{
                width: "100%",
                height: `${iframeHeight}px`,
                maxHeight: "100%",
                maxWidth: "100%",
                aspectRatio: "16/9",
              }}
            >
              <iframe
                ref={iframeRef}
                src={serverUrl}
                className="w-full h-full border-0"
                title="Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
                allow="accelerometer; autoplay; camera; encrypted-media; geolocation; gyroscope; microphone; midi; payment; usb; vr; xr-spatial-tracking"
                loading="lazy"
                onLoad={() => {
                  // Clear errors on successful load
                  setErrors([]);
                }}
                onError={() => {
                  setErrors((prev) => [
                    ...prev,
                    {
                      message: 'Iframe loading error',
                      source: serverUrl || 'Unknown',
                      line: 0,
                      timestamp: new Date().toISOString(),
                    },
                  ]);
                }}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            {isServerRunning ? (
              <>
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-400" />
                <p className="text-neutral-300">Waiting for server URL...</p>
              </>
            ) : (
              <>
                <Eye className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
                <p className="text-neutral-300">Server is not running</p>
                <p className="text-neutral-500 text-sm mt-1">
                  Start building to see preview
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Preview;
