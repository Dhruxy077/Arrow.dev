// client/components/Preview/Preview.jsx
import React from "react";
import { Eye, Loader2 } from "lucide-react";

const Preview = ({ serverUrl, isServerRunning }) => {
  return (
    <div className="w-full h-full bg-white">
      {isServerRunning && serverUrl ? (
        <iframe
          src={serverUrl}
          className="w-full h-full border-0"
          title="Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500 bg-gray-100">
          <div className="text-center">
            {isServerRunning ? (
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
            ) : (
              <Eye className="w-8 h-8 mx-auto mb-2" />
            )}
            <p>
              {isServerRunning
                ? "Waiting for server URL..."
                : "Server is not running."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Preview;
