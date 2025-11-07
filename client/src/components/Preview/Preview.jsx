import React, { useState } from "react";
import { Eye, Loader2, Smartphone, Tablet, Monitor, ExternalLink } from "lucide-react";

const DEVICES = {
  mobile: { width: 375, height: 667, label: "Mobile", icon: Smartphone },
  tablet: { width: 768, height: 1024, label: "Tablet", icon: Tablet },
  desktop: { width: 1200, height: 800, label: "Desktop", icon: Monitor },
};

const Preview = ({ serverUrl, isServerRunning }) => {
  const [device, setDevice] = useState("desktop");
  const currentDevice = DEVICES[device];
  const DeviceIcon = currentDevice.icon;

  return (
    <div className="flex flex-col h-full bg-neutral-900 text-white">
      <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-neutral-800 h-14">
        <h3 className="text-sm font-medium">Preview</h3>
        <div className="flex items-center gap-2">
          {Object.entries(DEVICES).map(([key, device]) => {
            const Icon = device.icon;
            return (
              <button
                key={key}
                onClick={() => setDevice(key)}
                title={device.label}
                className={`p-2 rounded transition-colors ${
                  device === currentDevice
                    ? "bg-blue-600 text-white"
                    : "text-neutral-400 hover:bg-neutral-800"
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
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

      <div className="flex-1 overflow-auto flex items-center justify-center bg-neutral-800 p-4">
        {isServerRunning && serverUrl ? (
          <div
            className="bg-white rounded-lg shadow-lg overflow-hidden border border-neutral-700"
            style={{
              width: currentDevice.width,
              height: currentDevice.height,
            }}
          >
            <iframe
              src={serverUrl}
              className="w-full h-full border-0"
              title="Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          </div>
        ) : (
          <div className="text-center">
            {isServerRunning ? (
              <>
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-400" />
                <p className="text-neutral-300">Waiting for server URL...</p>
              </>
            ) : (
              <>
                <Eye className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
                <p className="text-neutral-300">Server is not running</p>
                <p className="text-neutral-500 text-sm mt-1">Start building to see preview</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Preview;
