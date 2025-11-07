// client/hooks/useWebContainer.js
import { useState, useEffect, useCallback } from "react";
import { webContainerService } from "../services/WebContainerService";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../services/api";

/**
 * Hook to manage WebContainer lifecycle
 * @returns {Object} WebContainer state and controls
 */
export const useWebContainer = () => {
  const [container, setContainer] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [serverUrl, setServerUrl] = useState("");
  const [isServerRunning, setIsServerRunning] = useState(false);
  const [status, setStatus] = useState({ message: "", progress: 0 });

  // Initialize WebContainer
  useEffect(() => {
    let cleanupFn = () => {};
    let isMounted = true;

    const initialize = async () => {
      try {
        setContainer(null);
        setIsReady(false);
        setServerUrl("");
        setIsServerRunning(false);

        const statusHandler = ({ status, progress }) => {
          if (isMounted) {
            setStatus({ message: status, progress });
            console.log(`${progress}%: ${status}`);
          }
        };
        webContainerService.addStatusListener(statusHandler);

        const errorHandler = (error) => {
          if (isMounted) {
            showErrorNotification("WebContainer error", [error.message]);
          }
        };
        webContainerService.addErrorListener(errorHandler);

        const container = await webContainerService.initialize();
        if (!isMounted) return;

        setContainer(container);

        // --- THIS BLOCK IS REMOVED ---
        // The 'server-ready' listener is now managed by the
        // WebContainerService.startDevServer() method itself.
        // --- END REMOVED BLOCK ---

        cleanupFn = () => {
          webContainerService.removeStatusListener(statusHandler);
          webContainerService.removeErrorListener(errorHandler);
        };

        setIsReady(true);
      } catch (error) {
        console.error("Error initializing WebContainer:", error);
        if (isMounted) {
          showErrorNotification("Failed to start development environment", [
            error.message,
          ]);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
      cleanupFn();
    };
  }, []);

  // Write files to WebContainer
  const writeFiles = useCallback(
    async (files) => {
      if (!container) {
        throw new Error("WebContainer not initialized");
      }
      await webContainerService.writeFiles(files);
    },
    [container]
  );

  // Install dependencies
  const installDependencies = useCallback(
    async (packageJsonContent) => {
      if (!container) {
        throw new Error("WebContainer not initialized");
      }
      await webContainerService.installDependencies(packageJsonContent);
    },
    [container]
  );

  // Start development server
  const startDevServer = useCallback(async () => {
    if (!container) {
      throw new Error("WebContainer not initialized");
    }

    try {
      // This promise now waits for the service and gets the URL
      const url = await webContainerService.startDevServer();

      // --- THIS IS THE NEW LOGIC ---
      // Set the state here, after the service resolves
      setServerUrl(url);
      setIsServerRunning(true);
      showSuccessNotification("Development server is ready!");
      // --- END NEW LOGIC ---

      return url;
    } catch (error) {
      setIsServerRunning(false);
      throw error;
    }
  }, [container]);

  return {
    container,
    isReady,
    serverUrl,
    isServerRunning,
    status,
    writeFiles,
    installDependencies,
    startDevServer,
  };
};
