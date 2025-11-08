// client/src/pages/BuilderPage/Builder.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { Code, Eye } from "lucide-react";

// Components
import Header from "../../components/Header/Header";
import Sidebar from "../../components/Sidebar/Sidebar";
import Toolbar from "../../components/Toolbar/Toolbar";
import FileTree from "../../components/FileTree/FileTree";
import CodeEditor from "../../components/CodeEditor/CodeEditor";
import Chat from "../../components/Chat/Chat";
import Preview from "../../components/Preview/Preview";
import MultiTerminal from "../../components/MultiTerminal/MultiTerminal";
import CommandPalette from "../../components/CommandPalette/CommandPalette";

// Services
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../services/api";
// ⚠️ Import parser functions directly (no dynamic import)
import {
  parseInitialGeneration,
  parseModification,
} from "../../services/AIResponseParser";
import { generateRequest, modifyRequest } from "../../services/api";
import { streamGenerate, streamModify } from "../../services/streamingApi";
import { StreamingParser } from "../../services/streamingParser";
import { projectService } from "../../services/projectService";
import { chatService } from "../../services/chatService";
import { supabase } from "../../services/supabaseClient";

// Hooks
import { useWebContainer } from "../../hooks/useWebContainer";

function applyUpdate(originalContent, search, replace) {
  const searchLines = search.trimEnd();
  const replaceLines = replace.trimEnd();
  if (originalContent.includes(searchLines)) {
    return originalContent.replace(searchLines, replaceLines);
  } else {
    console.warn("Search block not found, appending code instead.", {
      search,
      replace,
    });
    return originalContent + "\n\n" + replaceLines;
  }
}

const Builder = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [activeView, setActiveView] = useState("code"); // ✅ Toggle state
  const [showTerminal, setShowTerminal] = useState(true);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showProjectsList, setShowProjectsList] = useState(false);
  const [showCodeSnippets, setShowCodeSnippets] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [selectedFile, setSelectedFile] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [generatingStage, setGeneratingStage] = useState(0);
  const [unsavedFiles, setUnsavedFiles] = useState(new Set());
  const [projectId, setProjectId] = useState(null);
  const [saveStatus, setSaveStatus] = useState("saved"); // 'saving', 'saved', 'error'
  const [userId, setUserId] = useState(null);
  const [abortController, setAbortController] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false); // Prevent duplicate generations

  const activeChat = useMemo(() => {
    return chats.find((c) => c.id === activeChatId) || null;
  }, [chats, activeChatId]);

  const files = activeChat?.generatedCode?.files || {};
  const isFirstMessage = !activeChat || Object.keys(files).length === 0;

  const {
    container,
    isReady: isContainerReady,
    isServerRunning,
    serverUrl,
    installDependencies,
    startDevServer,
  } = useWebContainer();

  const updateActiveChat = async (updateFn) => {
    if (!activeChat) {
      console.warn("updateActiveChat: activeChat is null");
      return;
    }
    
    const updatedChat = updateFn(activeChat);
    if (updatedChat) {
      setChats((prev) =>
        prev.map((chat) => (chat.id === activeChatId ? updatedChat : chat))
      );
      
      // Update in backend if projectId exists (or localStorage if not authenticated)
      if (projectId) {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // Update localStorage for unauthenticated users
          const chats = JSON.parse(localStorage.getItem('chats') || '[]');
          const chatIndex = chats.findIndex(c => c.id === activeChatId);
          if (chatIndex !== -1) {
            chats[chatIndex] = updatedChat;
            localStorage.setItem('chats', JSON.stringify(chats));
          }
        } else if (updatedChat.generatedCode?.files) {
          // Update in backend for authenticated users
          const packageJson = updatedChat.generatedCode.files["package.json"];
          const dependencies = packageJson
            ? JSON.parse(packageJson).dependencies || {}
            : {};
          
          await chatService.updateProjectFiles(
            projectId,
            updatedChat.generatedCode.files,
            dependencies
          );
        }
      }
    }
  };

  const handleSetMessageContent = useCallback(async (messageId, content) => {
    if (!activeChatId) return;
    
    // Update local state immediately
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              messages: (chat.messages || []).map((msg) =>
                msg.id === messageId ? { ...msg, content } : msg
              ),
            }
          : chat
      )
    );

    // Update in backend (or localStorage if not authenticated)
    if (messageId) {
      await chatService.updateMessage(messageId, content);
      
      // Also update localStorage for unauthenticated users
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const chats = JSON.parse(localStorage.getItem('chats') || '[]');
        const chatIndex = chats.findIndex(c => c.id === activeChatId);
        if (chatIndex !== -1) {
          chats[chatIndex].messages = chats[chatIndex].messages.map((msg) =>
            msg.id === messageId ? { ...msg, content } : msg
          );
          localStorage.setItem('chats', JSON.stringify(chats));
        }
      }
    }
  }, [activeChatId]);

  const handleNewChat = async (initialPrompt = "") => {
    try {
      const { chat, error } = await chatService.createChat(initialPrompt);
      if (error && !chat) {
        // Only show error if we don't have a fallback chat
        showErrorNotification("Failed to create chat", [error.message]);
        return;
      }

      if (chat) {
        setChats([chat, ...chats]);
        setActiveChatId(chat.id);
        setProjectId(chat.projectId);
        setSelectedFile("");
        navigate("/builder", { replace: true });

        if (initialPrompt && isContainerReady) {
          autoGenerate(initialPrompt, chat.id);
        }
      }
    } catch (error) {
      console.error("Error creating chat:", error);
      // Don't show error notification if it's just an auth issue (we have localStorage fallback)
      if (!error.message.includes('authenticated')) {
        showErrorNotification("Failed to create chat", [error.message]);
      }
    }
  };

  // Load chats from backend on mount
  useEffect(() => {
    const loadChats = async () => {
      setIsLoadingChats(true);
      try {
        const { chats: loadedChats, error } = await chatService.getUserChats();
        if (error) {
          console.error("Error loading chats:", error);
          showErrorNotification("Failed to load chats", [error.message]);
        } else {
          setChats(loadedChats);
          
          // Set active chat if there's one in URL or select first chat
          const urlParams = new URLSearchParams(window.location.search);
          const chatIdFromUrl = urlParams.get("chat");
          
          if (chatIdFromUrl && loadedChats.find(c => c.id === chatIdFromUrl)) {
            setActiveChatId(chatIdFromUrl);
            setProjectId(chatIdFromUrl);
          } else if (loadedChats.length > 0) {
            setActiveChatId(loadedChats[0].id);
            setProjectId(loadedChats[0].projectId);
          }
        }
      } catch (error) {
        console.error("Error loading chats:", error);
      } finally {
        setIsLoadingChats(false);
      }
    };

    loadChats();
  }, []);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Auto-save project every 30 seconds
  useEffect(() => {
    if (!projectId || !userId || Object.keys(files).length === 0) return;

    const autoSaveInterval = setInterval(async () => {
      try {
        setSaveStatus("saving");
        const packageJson = files["package.json"];
        const dependencies = packageJson
          ? JSON.parse(packageJson).dependencies || {}
          : {};

        const { error } = await projectService.autoSaveProject(
          projectId,
          files,
          dependencies
        );

        if (error) {
          console.error("Auto-save error:", error);
          setSaveStatus("error");
          setTimeout(() => setSaveStatus("saved"), 2000);
        } else {
          setSaveStatus("saved");
        }
      } catch (error) {
        console.error("Auto-save error:", error);
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("saved"), 2000);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [projectId, userId, files]);

  useEffect(() => {
    if (isLoadingChats) return; // Wait for chats to load

    const prompt =
      location.state?.initialPrompt || sessionStorage.getItem("initialPrompt");
    if (prompt) {
      sessionStorage.removeItem("initialPrompt");
      if (isContainerReady) {
        handleNewChat(prompt);
      }
    } else if (!activeChatId && chats.length === 0 && !isLoadingChats) {
      handleNewChat();
    }
  }, [isContainerReady, location.state, isLoadingChats]);

  // Handle project import
  useEffect(() => {
    const handleImport = async (event) => {
      const projectData = event.detail;
      if (!projectData || !projectData.files) return;

      try {
        const newChatId = crypto.randomUUID();
        const newChat = {
          id: newChatId,
          title: projectData.name || "Imported Project",
          timestamp: new Date().toISOString(),
          messages: [
            {
              id: crypto.randomUUID(),
              type: "assistant",
              content: `Project "${projectData.name || "Untitled"}" imported successfully!`,
            },
          ],
          generatedCode: { files: projectData.files },
        };

        setChats([newChat, ...chats]);
        setActiveChatId(newChatId);
        setSelectedFile("");

        // Write files to WebContainer
        if (container && Object.keys(projectData.files).length > 0) {
          for (const [filePath, content] of Object.entries(projectData.files)) {
            const dir = filePath.split("/").slice(0, -1).join("/");
            if (dir) {
              await container.fs.mkdir(dir, { recursive: true });
            }
            await container.fs.writeFile(filePath, content);
          }
        }
      } catch (error) {
        console.error("Import error:", error);
        showErrorNotification("Failed to import project", [error.message]);
      }
    };

    window.addEventListener("importProject", handleImport);
    return () => window.removeEventListener("importProject", handleImport);
  }, [container, chats]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Command palette: Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
        return;
      }

      // Toggle code view: Ctrl+1
      if ((e.ctrlKey || e.metaKey) && e.key === "1") {
        e.preventDefault();
        setActiveView("code");
        return;
      }

      // Toggle preview: Ctrl+2
      if ((e.ctrlKey || e.metaKey) && e.key === "2") {
        e.preventDefault();
        setActiveView("preview");
        return;
      }

      // Toggle terminal: Ctrl+`
      if ((e.ctrlKey || e.metaKey) && e.key === "`") {
        e.preventDefault();
        setShowTerminal((prev) => !prev);
        return;
      }

      // Export: Ctrl+E
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault();
        // Trigger export via Header
        const exportBtn = document.querySelector('[title="Export project as JSON"]');
        if (exportBtn) exportBtn.click();
        return;
      }

      // Import: Ctrl+I
      if ((e.ctrlKey || e.metaKey) && e.key === "i") {
        e.preventDefault();
        const importBtn = document.querySelector('[title="Import project from JSON"]');
        if (importBtn) importBtn.click();
        return;
      }

      // Share: Ctrl+Shift+H
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "H") {
        e.preventDefault();
        const shareBtn = document.querySelector('[title="Share project"]');
        if (shareBtn) shareBtn.click();
        return;
      }

      // Toggle Sidebar: Ctrl+B or Cmd+B
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
        return;
      }

      // Toggle Projects List: Ctrl+P
      if ((e.ctrlKey || e.metaKey) && e.key === "p" && !e.shiftKey) {
        e.preventDefault();
        setShowProjectsList((prev) => !prev);
        return;
      }

      // Toggle Code Snippets: Ctrl+Shift+S
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "S") {
        e.preventDefault();
        setShowCodeSnippets((prev) => !prev);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Theme toggle
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const handleCommandPaletteAction = (action) => {
    switch (action) {
      case "new-file":
        handleCreateFile("new-file.js");
        break;
      case "toggle-code":
        setActiveView("code");
        break;
      case "toggle-preview":
        setActiveView("preview");
        break;
      case "toggle-terminal":
        setShowTerminal((prev) => !prev);
        break;
      case "export":
        const exportBtn = document.querySelector('[title="Export project as JSON"]');
        if (exportBtn) exportBtn.click();
        break;
      case "import":
        const importBtn = document.querySelector('[title="Import project from JSON"]');
        if (importBtn) importBtn.click();
        break;
      case "share":
        const shareBtn = document.querySelector('[title="Share project"]');
        if (shareBtn) shareBtn.click();
        break;
      case "toggle-theme":
        setIsDark((prev) => !prev);
        break;
      case "toggle-projects":
        setShowProjectsList((prev) => !prev);
        break;
      case "toggle-snippets":
        setShowCodeSnippets((prev) => !prev);
        break;
      default:
        break;
    }
  };

  // ✅ FIXED: No dynamic imports — use direct imports
  const handleCodeGenerated = useCallback(
    async (chatId, projectName, newFiles) => {
      if (!container) {
        showErrorNotification("WebContainer not ready.");
        setIsLoading(false);
        setIsImporting(false);
        return;
      }

      try {
        setGeneratingStage(2);
        if (!newFiles["package.json"]) {
          throw new Error("AI did not generate a package.json file.");
        }

        setGeneratingStage(3);
        for (const [filename, content] of Object.entries(newFiles)) {
          const dir = filename.split("/").slice(0, -1).join("/");
          if (dir) await container.fs.mkdir(dir, { recursive: true });
          await container.fs.writeFile(filename, content);
        }

        setGeneratingStage(4);
        await installDependencies(newFiles["package.json"]);

        setGeneratingStage(5);
        await startDevServer();

        showSuccessNotification("Project Generated Successfully!");

        // Update chat in state
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  title: projectName,
                  generatedCode: { files: newFiles },
                }
              : chat
          )
        );

        // Update project in backend
        if (projectId) {
          try {
            const packageJson = newFiles["package.json"];
            const dependencies = packageJson
              ? JSON.parse(packageJson).dependencies || {}
              : {};

            // Update project name and files
            await chatService.updateProjectName(projectId, projectName);
            await chatService.updateProjectFiles(projectId, newFiles, dependencies);
          } catch (error) {
            console.error("Error saving project:", error);
          }
        }

        const entryFile =
          newFiles["index.html"] ||
          newFiles["src/main.jsx"] ||
          Object.keys(newFiles)[0];
        setSelectedFile(entryFile || "");
        setIsImporting(false);
        setIsLoading(false);
      } catch (error) {
        console.error("Error processing generated code:", error);
        showErrorNotification("Error processing code", [error.message]);
        setIsImporting(false);
        setIsLoading(false);
      }
    },
    [container, installDependencies, startDevServer]
  );

  const autoGenerate = useCallback(
    async (prompt, chatId) => {
      if (!chatId) {
        console.error("autoGenerate: chatId is required");
        showErrorNotification("No active chat. Please try again.");
        return;
      }

      // Prevent duplicate generations
      if (isGenerating) {
        console.warn("autoGenerate: Already generating, ignoring duplicate request");
        return;
      }

      console.log("autoGenerate: Starting generation", { prompt, chatId });
      setIsGenerating(true);
      setIsLoading(true);
      setIsImporting(true);
      setGeneratingStage(1);

      // Create abort controller for cancellation
      const controller = new AbortController();
      setAbortController(controller);

      let assistantMessageId = null;
      let streamingContent = "";
      const parser = new StreamingParser();

      // Ensure chat exists before updating
      const currentChat = chats.find((c) => c.id === chatId);
      if (!currentChat) {
        console.error("autoGenerate: Chat not found", chatId);
        showErrorNotification("Chat not found. Please try again.");
        setIsLoading(false);
        setIsImporting(false);
        return;
      }

      // Create assistant message in backend
      if (projectId) {
        const { message, error } = await chatService.addMessage(projectId, 'assistant', '');
        if (error) {
          console.error("Error creating assistant message:", error);
        } else if (message) {
          assistantMessageId = message.id;
        }
      }

      // Fallback to local ID if backend save failed
      if (!assistantMessageId) {
        assistantMessageId = crypto.randomUUID();
      }

      // Check if there's already an empty assistant message (prevent duplicates)
      const hasEmptyAssistant = currentChat.messages.some(
        msg => msg.type === "assistant" && (!msg.content || msg.content === "" || msg.content === "...")
      );

      // Only add assistant message if one doesn't already exist
      if (!hasEmptyAssistant) {
        updateActiveChat((chat) => ({
          ...chat,
          messages: [
            ...chat.messages,
            { id: assistantMessageId, type: "assistant", content: "" },
          ],
        }));
      } else {
        // Use existing empty assistant message
        const existingEmpty = currentChat.messages.find(
          msg => msg.type === "assistant" && (!msg.content || msg.content === "" || msg.content === "...")
        );
        if (existingEmpty) {
          assistantMessageId = existingEmpty.id;
        }
      }

      try {
        console.log("autoGenerate: Calling streamGenerate API");
        
        // Build conversation history for context
        const conversationHistory = currentChat.messages
          .filter((msg) => msg.type === "user" || msg.type === "assistant")
          .map((msg) => ({
            role: msg.type === "user" ? "user" : "assistant",
            content: msg.content,
          }))
          .slice(-5); // Last 5 messages for context

        // Use streaming API
        await streamGenerate(prompt, {
          conversationHistory,
          onChunk: async (chunk) => {
            // Update message content incrementally
            streamingContent += chunk;
            parser.processChunk(chunk);
            
            // Update UI with streaming content
            await handleSetMessageContent(assistantMessageId, streamingContent);
          },
          onComplete: async (fullContent) => {
            // Parse final result
            const result = parser.getResult();
            let { projectName, files, commands, explanation, error } = result;
            
            if (error || Object.keys(files).length === 0) {
              // Try fallback parsing
              const parsed = parseInitialGeneration(fullContent);
              if (parsed.error) {
                throw new Error(parsed.error || "Failed to parse AI response");
              }
              projectName = parsed.projectName;
              files = parsed.files;
              commands = parsed.commands || [];
              explanation = parsed.explanation || "";
            }

            // Execute commands if any
            if (commands && commands.length > 0 && container) {
              console.log("Executing AI-suggested commands:", commands);
              for (const command of commands) {
                try {
                  // Execute command in terminal if available, otherwise spawn directly
                  const terminalElement = document.querySelector(`[data-terminal-id="main-terminal"]`);
                  if (terminalElement) {
                    // Try to find terminal instance and execute command
                    const terminalInstance = terminalElement._terminalInstance;
                    if (terminalInstance && terminalInstance.executeCommand) {
                      await terminalInstance.executeCommand(command);
                      console.log(`Executed command in terminal: ${command}`);
                    } else {
                      // Fallback: spawn directly
                      const process = await container.spawn("jsh", ["-c", command]);
                      console.log(`Started command: ${command}`);
                    }
                  } else {
                    // Fallback: spawn directly
                    const process = await container.spawn("jsh", ["-c", command]);
                    console.log(`Started command: ${command}`);
                  }
                } catch (cmdError) {
                  console.warn(`Failed to execute command "${command}":`, cmdError);
                }
              }
            }

            // Add explanation to chat if provided
            if (explanation) {
              handleSetMessageContent(assistantMessageId, `${explanation}\n\n${streamingContent}`);
            }

            await handleCodeGenerated(chatId, projectName, files);
          },
          onError: (error) => {
            console.error("Streaming error:", error);
            const errorContent = `Sorry, I encountered an error: \n\n\`\`\`\n${error.message}\n\`\`\``;
            handleSetMessageContent(assistantMessageId, errorContent);
            setIsLoading(false);
            setIsImporting(false);
          },
          signal: controller.signal,
        });
      } catch (error) {
        if (error.name === "AbortError") {
          console.log("Generation cancelled");
          return;
        }
        
        console.error("autoGenerate error:", error);
        const errorContent = `Sorry, I encountered an error: \n\n\`\`\`\n${error.message}\n\`\`\``;
        handleSetMessageContent(assistantMessageId, errorContent);
        setIsLoading(false);
        setIsImporting(false);
      } finally {
        setAbortController(null);
        setIsGenerating(false);
        setIsLoading(false);
        setIsImporting(false);
      }
    },
    [handleCodeGenerated, updateActiveChat, handleSetMessageContent, chats, isGenerating, projectId]
  );

  const handleModifyRequest = useCallback(
    async (userInput, chatId) => {
      if (!chatId) {
        console.error("handleModifyRequest: chatId is required");
        showErrorNotification("No active chat. Please try again.");
        return;
      }

      // Prevent duplicate modifications
      if (isGenerating) {
        console.warn("handleModifyRequest: Already generating, ignoring duplicate request");
        return;
      }

      if (!container || !activeChat) {
        console.error("handleModifyRequest: Container or activeChat not available", { 
          hasContainer: !!container, 
          hasActiveChat: !!activeChat 
        });
        showErrorNotification("WebContainer is not ready. Please wait...");
        return;
      }

      console.log("handleModifyRequest: Starting modification", { userInput, chatId });
      setIsGenerating(true);
      setIsLoading(true);
      const controller = new AbortController();
      setAbortController(controller);

      let assistantMessageId = null;
      let streamingContent = "";
      const parser = new StreamingParser();

      // Create assistant message in backend
      if (projectId) {
        const { message, error } = await chatService.addMessage(projectId, 'assistant', '');
        if (error) {
          console.error("Error creating assistant message:", error);
        } else if (message) {
          assistantMessageId = message.id;
        }
      }

      // Fallback to local ID if backend save failed
      if (!assistantMessageId) {
        assistantMessageId = crypto.randomUUID();
      }

      // Check if there's already an empty assistant message (prevent duplicates)
      const hasEmptyAssistant = activeChat.messages.some(
        msg => msg.type === "assistant" && (!msg.content || msg.content === "" || msg.content === "...")
      );

      // Only add assistant message if one doesn't already exist
      if (!hasEmptyAssistant) {
        updateActiveChat((chat) => ({
          ...chat,
          messages: [
            ...chat.messages,
            { id: assistantMessageId, type: "assistant", content: "" },
          ],
        }));
      } else {
        // Use existing empty assistant message
        const existingEmpty = activeChat.messages.find(
          msg => msg.type === "assistant" && (!msg.content || msg.content === "" || msg.content === "...")
        );
        if (existingEmpty) {
          assistantMessageId = existingEmpty.id;
        }
      }

      try {
        console.log("handleModifyRequest: Calling streamModify API");
        
        // Build conversation history for context
        const conversationHistory = activeChat.messages
          .filter((msg) => msg.type === "user" || msg.type === "assistant")
          .map((msg) => ({
            role: msg.type === "user" ? "user" : "assistant",
            content: msg.content,
          }))
          .slice(-5); // Last 5 messages for context

        await streamModify(userInput, files, {
          conversationHistory,
          onChunk: async (chunk) => {
            streamingContent += chunk;
            parser.processChunk(chunk);
            await handleSetMessageContent(assistantMessageId, streamingContent);
          },
          onComplete: async (fullContent) => {
            const result = parser.getResult();
            let { projectName, files: newFiles, updates, commands, explanation } = result;

            // Fallback to full parsing if streaming parser didn't get complete data
            if (updates.length === 0 && Object.keys(newFiles).length === 0) {
              const parsed = parseModification(fullContent);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              newFiles = parsed.newFiles;
              updates = parsed.updates;
              projectName = parsed.projectName;
              commands = parsed.commands || [];
              explanation = parsed.explanation || "";
            }

            // Execute commands if any
            if (commands && commands.length > 0 && container) {
              console.log("Executing AI-suggested commands:", commands);
              for (const command of commands) {
                try {
                  // Execute command in terminal if available, otherwise spawn directly
                  const terminalElement = document.querySelector(`[data-terminal-id="main-terminal"]`);
                  if (terminalElement) {
                    const terminalInstance = terminalElement._terminalInstance;
                    if (terminalInstance && terminalInstance.executeCommand) {
                      await terminalInstance.executeCommand(command);
                      console.log(`Executed command in terminal: ${command}`);
                    } else {
                      const process = await container.spawn("jsh", ["-c", command]);
                      console.log(`Started command: ${command}`);
                    }
                  } else {
                    const process = await container.spawn("jsh", ["-c", command]);
                    console.log(`Started command: ${command}`);
                  }
                } catch (cmdError) {
                  console.warn(`Failed to execute command "${command}":`, cmdError);
                }
              }
            }

            // Add explanation to chat if provided
            if (explanation) {
              handleSetMessageContent(assistantMessageId, `${explanation}\n\n${streamingContent}`);
            }

            await handleCodeModified(chatId, projectName, updates, newFiles);
          },
          onError: (error) => {
            console.error("Modify streaming error:", error);
            const errorContent = `Sorry, I encountered an error: \n\n\`\`\`\n${error.message}\n\`\`\``;
            handleSetMessageContent(assistantMessageId, errorContent);
            setIsLoading(false);
          },
          signal: controller.signal,
        });
      } catch (error) {
        if (error.name === "AbortError") {
          console.log("Modification cancelled");
          return;
        }
        console.error("handleModifyRequest error:", error);
        const errorContent = `Sorry, I encountered an error: \n\n\`\`\`\n${error.message}\n\`\`\``;
        handleSetMessageContent(assistantMessageId, errorContent);
        setIsLoading(false);
      } finally {
        setAbortController(null);
        setIsGenerating(false);
        setIsLoading(false);
      }
    },
    [container, files, activeChat, handleSetMessageContent, chats, isGenerating, projectId]
  );

  const handleCodeModified = useCallback(
    async (chatId, projectName, updates, newFiles) => {
      if (!container) return;
      setIsLoading(true);
      setIsImporting(true);
      setGeneratingStage(3);

      try {
        let updatedFiles = { ...files };
        for (const [filename, content] of Object.entries(newFiles)) {
          const dir = filename.split("/").slice(0, -1).join("/");
          if (dir) await container.fs.mkdir(dir, { recursive: true });
          await container.fs.writeFile(filename, content);
          updatedFiles[filename] = content;
        }

        for (const { file, search, replace } of updates) {
          if (!updatedFiles[file]) continue;
          const updatedContent = applyUpdate(
            updatedFiles[file],
            search,
            replace
          );
          await container.fs.writeFile(file, updatedContent);
          updatedFiles[file] = updatedContent;
        }

        // Update chat in state
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  title: projectName,
                  generatedCode: { files: updatedFiles },
                }
              : chat
          )
        );

        // Update project in backend
        if (projectId) {
          try {
            const packageJson = updatedFiles["package.json"];
            const dependencies = packageJson
              ? JSON.parse(packageJson).dependencies || {}
              : {};

            await chatService.updateProjectName(projectId, projectName);
            await chatService.updateProjectFiles(projectId, updatedFiles, dependencies);
          } catch (error) {
            console.error("Error updating project:", error);
          }
        }

        if (selectedFile) {
          setSelectedFile("");
          setTimeout(() => setSelectedFile(selectedFile), 0);
        }
        showSuccessNotification("Project Updated!");
      } catch (error) {
        console.error("Error applying modifications:", error);
        showErrorNotification("Error applying code changes", [error.message]);
      } finally {
        setIsLoading(false);
        setIsImporting(false);
      }
    },
    [container, files, selectedFile, projectId, userId]
  );

  const handleFileSelect = useCallback(
    (filePath) => setSelectedFile(filePath),
    []
  );

  const handleCreateFile = useCallback(
    async (filePath) => {
      if (!container) {
        showErrorNotification("WebContainer not ready", ["Please wait for the environment to initialize"]);
        return;
      }

      try {
        const dir = filePath.split("/").slice(0, -1).join("/");
        if (dir) {
          await container.fs.mkdir(dir, { recursive: true });
        }
        await container.fs.writeFile(filePath, "");
        
        updateActiveChat((chat) => ({
          ...chat,
          generatedCode: {
            ...chat.generatedCode,
            files: { ...chat.generatedCode.files, [filePath]: "" },
          },
        }));
        
        setSelectedFile(filePath);
        showSuccessNotification(`Created file: ${filePath}`);
      } catch (error) {
        console.error("Error creating file:", error);
        showErrorNotification("Failed to create file", [error.message]);
      }
    },
    [container, updateActiveChat]
  );

  const handleCreateFolder = useCallback(
    async (folderPath) => {
      if (!container) {
        showErrorNotification("WebContainer not ready", ["Please wait for the environment to initialize"]);
        return;
      }

      try {
        await container.fs.mkdir(folderPath, { recursive: true });
        showSuccessNotification(`Created folder: ${folderPath}`);
      } catch (error) {
        console.error("Error creating folder:", error);
        showErrorNotification("Failed to create folder", [error.message]);
      }
    },
    [container]
  );

  const handleRenameFile = useCallback(
    async (oldPath, newName) => {
      if (!container) {
        showErrorNotification("WebContainer not ready", ["Please wait for the environment to initialize"]);
        return;
      }

      try {
        const dir = oldPath.split("/").slice(0, -1).join("/");
        const newPath = dir ? `${dir}/${newName}` : newName;

        // Read old file content
        const content = files[oldPath] || await container.fs.readFile(oldPath, "utf-8");
        
        // Create new file
        const newDir = newPath.split("/").slice(0, -1).join("/");
        if (newDir) {
          await container.fs.mkdir(newDir, { recursive: true });
        }
        await container.fs.writeFile(newPath, content);
        
        // Delete old file
        await container.fs.rm(oldPath);

        // Update state
        const newFiles = { ...files };
        delete newFiles[oldPath];
        newFiles[newPath] = content;

        updateActiveChat((chat) => ({
          ...chat,
          generatedCode: {
            ...chat.generatedCode,
            files: newFiles,
          },
        }));

        if (selectedFile === oldPath) {
          setSelectedFile(newPath);
        }

        showSuccessNotification(`Renamed to: ${newPath}`);
      } catch (error) {
        console.error("Error renaming file:", error);
        showErrorNotification("Failed to rename file", [error.message]);
      }
    },
    [container, files, selectedFile, updateActiveChat]
  );

  const handleDeleteFile = useCallback(
    async (filePath) => {
      if (!container) {
        showErrorNotification("WebContainer not ready", ["Please wait for the environment to initialize"]);
        return;
      }

      try {
        await container.fs.rm(filePath, { recursive: true });

        // Update state
        const newFiles = { ...files };
        delete newFiles[filePath];

        updateActiveChat((chat) => ({
          ...chat,
          generatedCode: {
            ...chat.generatedCode,
            files: newFiles,
          },
        }));

        if (selectedFile === filePath) {
          setSelectedFile("");
        }

        showSuccessNotification(`Deleted: ${filePath}`);
      } catch (error) {
        console.error("Error deleting file:", error);
        showErrorNotification("Failed to delete file", [error.message]);
      }
    },
    [container, files, selectedFile, updateActiveChat]
  );
  const handleCodeChange = useCallback(
    async (value, fileName = selectedFile) => {
      if (!fileName || !container) return;
      updateActiveChat((chat) => ({
        ...chat,
        generatedCode: {
          ...chat.generatedCode,
          files: { ...chat.generatedCode.files, [fileName]: value },
        },
      }));
      setUnsavedFiles((prev) => new Set(prev).add(fileName));
      try {
        await container.fs.writeFile(fileName, value);
        setUnsavedFiles((prev) => {
          const next = new Set(prev);
          next.delete(fileName);
          return next;
        });
      } catch (error) {
        console.error("Error writing file:", error);
      }
    },
    [selectedFile, container]
  );

  const handleAddMessage = async (message) => {
    if (!activeChat) {
      console.warn("handleAddMessage: activeChat is null");
      return;
    }
    
    // Update local state
    updateActiveChat((chat) => ({
      ...chat,
      messages: [...(chat.messages || []), message],
    }));
    
    // Update localStorage for unauthenticated users
    const { data: { user } } = await supabase.auth.getUser();
    if (!user && activeChatId) {
      const chats = JSON.parse(localStorage.getItem('chats') || '[]');
      const chatIndex = chats.findIndex(c => c.id === activeChatId);
      if (chatIndex !== -1) {
        chats[chatIndex].messages = [...(chats[chatIndex].messages || []), message];
        localStorage.setItem('chats', JSON.stringify(chats));
      }
    }
  };

  const handleEditMessage = useCallback(
    (messageId, newContent) => {
      updateActiveChat((chat) => ({
        ...chat,
        messages: chat.messages.map((msg) =>
          msg.id === messageId ? { ...msg, content: newContent } : msg
        ),
      }));

      // If it's a user message, we can optionally re-send it
      const message = activeChat?.messages.find((m) => m.id === messageId);
      if (message?.type === "user" && newContent.trim()) {
        // Remove the assistant response that followed this message
        const messageIndex = activeChat.messages.findIndex((m) => m.id === messageId);
        if (messageIndex !== -1) {
          const updatedMessages = activeChat.messages.slice(0, messageIndex + 1);
          updateActiveChat((chat) => ({
            ...chat,
            messages: updatedMessages,
          }));
          // Re-send the edited message
          if (isFirstMessage) {
            autoGenerate(newContent, activeChatId);
          } else {
            handleModifyRequest(newContent, activeChatId);
          }
        }
      }
    },
    [activeChat, activeChatId, isFirstMessage, autoGenerate, handleModifyRequest, updateActiveChat]
  );

  const handleRegenerateMessage = useCallback(
    (messageId) => {
      const message = activeChat?.messages.find((m) => m.id === messageId);
      if (!message || message.type !== "assistant") return;

      // Find the user message that preceded this assistant message
      const messageIndex = activeChat.messages.findIndex((m) => m.id === messageId);
      if (messageIndex > 0) {
        const userMessage = activeChat.messages[messageIndex - 1];
        if (userMessage.type === "user") {
          // Remove the assistant message and regenerate
          const updatedMessages = activeChat.messages.slice(0, messageIndex);
          updateActiveChat((chat) => ({
            ...chat,
            messages: updatedMessages,
          }));

          // Re-send the user's message
          if (isFirstMessage) {
            autoGenerate(userMessage.content, activeChatId);
          } else {
            handleModifyRequest(userMessage.content, activeChatId);
          }
        }
      }
    },
    [activeChat, activeChatId, isFirstMessage, autoGenerate, handleModifyRequest, updateActiveChat]
  );

  // ✅ Send message to backend via Chat's callbacks
  const onCodeGenerated = (projectName, files) =>
    handleCodeGenerated(activeChat.id, projectName, files);

  const onCodeModified = (projectName, updates, newFiles) =>
    handleCodeModified(activeChat.id, projectName, updates, newFiles);

  return (
    <div className="flex flex-col h-screen bg-[#0F1117] text-white relative z-0">
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onAction={handleCommandPaletteAction}
      />
      {/* <Header
        projectId={projectId}
        projectName={activeChat?.title || "Untitled Project"}
        saveStatus={saveStatus}
        files={files}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      /> */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Sidebar with Recent Chats */}
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={async (chatId) => {
            const selectedChat = chats.find(c => c.id === chatId);
            setActiveChatId(chatId);
            if (selectedChat) {
              setProjectId(selectedChat.projectId || chatId);
              
              // Reload messages from backend to ensure we have latest data
              const messages = await chatService.getChatMessages(selectedChat.projectId || chatId);
              setChats((prev) =>
                prev.map((chat) =>
                  chat.id === chatId
                    ? {
                        ...chat,
                        messages,
                      }
                    : chat
                )
              );
            }
            setSidebarOpen(false); // Close on mobile after selection
          }}
          onNewChat={handleNewChat}
        />

        {/* Chat Panel */}
        <div className="hidden lg:flex w-96 border-r border-[#1F2937] flex flex-col h-full relative z-10">
          <Chat
            initialMessages={activeChat?.messages || []}
            isLoading={isLoading}
            onSendMessage={async (message) => {
              // Prevent sending if already generating
              if (isGenerating) {
                showErrorNotification("Please wait for the current generation to complete");
                return;
              }

              // Ensure we have an active chat before sending
              if (!activeChatId) {
                // Create a new chat if one doesn't exist
                await handleNewChat(message);
                return;
              }

              // Note: The user message is already added by onAddMessage in Chat component
              // We just need to trigger the AI generation here

              if (isFirstMessage) {
                // First message - generate new project
                autoGenerate(message, activeChatId);
              } else {
                // Follow-up message - modify existing project
                handleModifyRequest(message, activeChatId);
              }
            }}
            currentFiles={files}
            onFileSelect={handleFileSelect}
            onAddMessage={async (message) => {
              // Save to backend if projectId exists (or localStorage if not authenticated)
              if (projectId && message.type === 'user') {
                const savedMessage = await chatService.addMessage(projectId, message.type, message.content);
                // Use the saved message ID if available
                if (savedMessage && savedMessage.id) {
                  message.id = savedMessage.id;
                }
              }
              handleAddMessage(message);
            }}
            isImporting={isImporting}
            generatingStage={generatingStage}
            onCancel={() => {
              if (abortController) {
                abortController.abort();
                setAbortController(null);
                setIsLoading(false);
                setIsImporting(false);
              }
            }}
            onEditMessage={handleEditMessage}
            onRegenerateMessage={handleRegenerateMessage}
            onClearChat={async () => {
              if (activeChatId && projectId) {
                await chatService.clearChat(projectId);
                // Reload messages
                const messages = await chatService.getChatMessages(projectId);
                setChats((prev) =>
                  prev.map((chat) =>
                    chat.id === activeChatId
                      ? {
                          ...chat,
                          messages,
                        }
                      : chat
                  )
                );
              }
            }}
            onExportChat={(messages) => {
              const chatData = {
                messages,
                exportedAt: new Date().toISOString(),
                projectName: activeChat?.title || "Untitled Project",
                version: "1.0.0",
              };
              const jsonStr = JSON.stringify(chatData, null, 2);
              const blob = new Blob([jsonStr], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `chat-export-${new Date().toISOString().split("T")[0]}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              showSuccessNotification("Chat exported successfully!");
            }}
          />
        </div>

        {/* Main: Toggle between Code and Preview */}
        <div className="flex-1 flex flex-col relative z-10">
          {/* Toolbar */}
          <Toolbar
            activeView={activeView}
            onViewChange={setActiveView}
            selectedFile={selectedFile}
            files={files}
            onFileSelect={handleFileSelect}
            onRefresh={() => window.location.reload()}
            onOpenExternal={() => {
              if (serverUrl) window.open(serverUrl, "_blank");
            }}
            onFullscreen={() => {
              // Toggle fullscreen
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
              } else {
                document.exitFullscreen();
              }
            }}
            onPublish={() => {
              // Handle publish
              showSuccessNotification("Publish feature coming soon!");
            }}
            onGitHubExport={() => {
              // Handle GitHub export
              showSuccessNotification("GitHub export feature coming soon!");
            }}
          />

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeView === "code" ? (
              <PanelGroup direction="horizontal" className="h-full">
                {showCodeSnippets && (
                  <>
                    <Panel defaultSize={20} minSize={15}>
                      <CodeSnippetsPanel
                        onInsertSnippet={(code) => {
                          if (selectedFile && container) {
                            const currentContent = files[selectedFile] || "";
                            const newContent = currentContent + "\n\n" + code;
                            handleCodeChange(newContent, selectedFile);
                          }
                        }}
                        onClose={() => setShowCodeSnippets(false)}
                      />
                    </Panel>
                    <PanelResizeHandle className="w-0.5 bg-[#1F2937] hover:bg-blue-600" />
                  </>
                )}
                <Panel defaultSize={20} minSize={15}>
                  <FileTree
                    files={files}
                    onFileSelect={handleFileSelect}
                    selectedFile={selectedFile}
                    onCreateFile={handleCreateFile}
                    onCreateFolder={handleCreateFolder}
                    onRenameFile={handleRenameFile}
                    onDeleteFile={handleDeleteFile}
                  />
                </Panel>
                <PanelResizeHandle className="w-0.5 bg-neutral-800 hover:bg-blue-600" />
                <Panel defaultSize={80} minSize={50}>
                  <PanelGroup direction="vertical" className="h-full">
                    <Panel defaultSize={70}>
                      <CodeEditor
                        key={selectedFile}
                        fileContent={files[selectedFile] || ""}
                        fileName={selectedFile}
                        onChange={handleCodeChange}
                        hasUnsavedChanges={unsavedFiles.has(selectedFile)}
                        files={files}
                        onFileSelect={handleFileSelect}
                        selectedFile={selectedFile}
                        onFileClose={(filePath) => {
                          // Optional: handle file close
                        }}
                      />
                    </Panel>
                    {showTerminal && (
                      <>
                        <PanelResizeHandle className="h-0.5 bg-[#1F2937] hover:bg-blue-600" />
                        <Panel defaultSize={30} minSize={20}>
                          <MultiTerminal
                            webcontainerInstance={container}
                            isContainerReady={isContainerReady}
                          />
                        </Panel>
                      </>
                    )}
                  </PanelGroup>
                </Panel>
              </PanelGroup>
            ) : (
              <Preview
                serverUrl={serverUrl}
                isServerRunning={isServerRunning}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Builder;
