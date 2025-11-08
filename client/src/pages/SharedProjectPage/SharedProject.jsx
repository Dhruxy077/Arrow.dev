// client/src/pages/SharedProjectPage/SharedProject.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, ArrowLeft, Code2 } from "lucide-react";
import { projectService } from "../../services/projectService";
import Builder from "../BuilderPage/Builder";

const SharedProject = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [project, setProject] = useState(null);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        const { share, project: loadedProject, error } = await projectService.getProjectByShareToken(token);
        
        if (error) {
          throw new Error(error.message || "Failed to load shared project");
        }

        if (!loadedProject) {
          throw new Error("Project not found");
        }

        setProject(loadedProject);
      } catch (err) {
        console.error("Error loading shared project:", err);
        setError(err.message || "Failed to load shared project");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadProject();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-900 text-white">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-400" />
          <p className="text-neutral-400">Loading shared project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-900 text-white">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
          <p className="text-neutral-400 mb-4">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  // Convert project to chat format for Builder
  const chatData = {
    id: `shared-${project.id}`,
    title: project.name,
    timestamp: project.created_at,
    messages: [
      {
        id: crypto.randomUUID(),
        type: "assistant",
        content: `This is a shared project: **${project.name}**\n\n${project.description || "No description provided."}`,
      },
    ],
    generatedCode: {
      files: project.files || {},
    },
  };

  // For now, we'll create a simplified view that shows the project files
  // In a full implementation, you'd want to integrate this with Builder
  return (
    <div className="h-screen flex flex-col bg-neutral-900 text-white">
      <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-neutral-800 border-b border-neutral-700">
        <div className="flex items-center gap-3">
          <Code2 className="w-5 h-5 text-blue-400" />
          <div>
            <h1 className="text-white font-medium">{project.name}</h1>
            <p className="text-xs text-neutral-400">Shared Project</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">Project Files</h2>
          <div className="space-y-4">
            {Object.entries(project.files || {}).map(([filePath, content]) => (
              <div key={filePath} className="bg-neutral-800 rounded-lg p-4">
                <h3 className="text-sm font-mono text-blue-400 mb-2">{filePath}</h3>
                <pre className="text-xs text-neutral-300 overflow-x-auto bg-neutral-900 p-3 rounded">
                  {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedProject;

