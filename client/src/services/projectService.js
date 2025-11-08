// client/src/services/projectService.js
import { supabase } from './supabaseClient';
import { showErrorNotification, showSuccessNotification } from './api';

/**
 * Project Service
 * Handles all project CRUD operations with Supabase
 */
export const projectService = {
  /**
   * Create a new project
   */
  async createProject(projectData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User must be authenticated to create projects');
      }

      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: projectData.name || 'Untitled Project',
          description: projectData.description || '',
          files: projectData.files || {},
          dependencies: projectData.dependencies || {},
          is_public: projectData.is_public || false,
        })
        .select()
        .single();

      if (error) throw error;

      showSuccessNotification('Project created successfully!');
      return { project: data, error: null };
    } catch (error) {
      console.error('Create project error:', error);
      showErrorNotification('Failed to create project', [error.message]);
      return { project: null, error };
    }
  },

  /**
   * Get project by ID
   */
  async getProject(projectId) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return { project: data, error: null };
    } catch (error) {
      console.error('Get project error:', error);
      return { project: null, error };
    }
  },

  /**
   * Get all projects for current user
   */
  async getUserProjects() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { projects: [], error: null };
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return { projects: data || [], error: null };
    } catch (error) {
      console.error('Get user projects error:', error);
      return { projects: [], error };
    }
  },

  /**
   * Update project
   */
  async updateProject(projectId, updates) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;
      return { project: data, error: null };
    } catch (error) {
      console.error('Update project error:', error);
      return { project: null, error };
    }
  },

  /**
   * Auto-save project (updates files and dependencies)
   */
  async autoSaveProject(projectId, files, dependencies = {}) {
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          files,
          dependencies,
          updated_at: new Date().toISOString(),
          last_accessed: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Auto-save error:', error);
      return { error };
    }
  },

  /**
   * Delete project
   */
  async deleteProject(projectId) {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      showSuccessNotification('Project deleted successfully!');
      return { error: null };
    } catch (error) {
      console.error('Delete project error:', error);
      showErrorNotification('Failed to delete project', [error.message]);
      return { error };
    }
  },

  /**
   * Fork/Duplicate project
   */
  async forkProject(projectId, newName = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User must be authenticated to fork projects');
      }

      // Get original project
      const { project, error: getError } = await this.getProject(projectId);
      if (getError || !project) {
        throw new Error('Failed to load project to fork');
      }

      // Create new project with same data
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: newName || `${project.name} (Copy)`,
          description: project.description,
          files: project.files,
          dependencies: project.dependencies,
          is_public: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Copy chat messages if any
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (messages && messages.length > 0) {
        const newMessages = messages.map(msg => ({
          project_id: data.id,
          role: msg.role,
          content: msg.content,
          metadata: msg.metadata,
        }));

        await supabase
          .from('chat_messages')
          .insert(newMessages);
      }

      showSuccessNotification('Project forked successfully!');
      return { project: data, error: null };
    } catch (error) {
      console.error('Fork project error:', error);
      showErrorNotification('Failed to fork project', [error.message]);
      return { project: null, error };
    }
  },

  /**
   * Share project (create share token)
   */
  async shareProject(projectId, expiresInDays = 30) {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const shareToken = crypto.randomUUID();

      const { data, error } = await supabase
        .from('shared_projects')
        .insert({
          project_id: projectId,
          share_token: shareToken,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Make project public if not already
      await supabase
        .from('projects')
        .update({ is_public: true })
        .eq('id', projectId);

      showSuccessNotification('Project shared successfully!');
      return { shareToken, share: data, error: null };
    } catch (error) {
      console.error('Share project error:', error);
      showErrorNotification('Failed to share project', [error.message]);
      return { shareToken: null, share: null, error };
    }
  },

  /**
   * Get project by share token
   */
  async getProjectByShareToken(shareToken) {
    try {
      const { data, error } = await supabase
        .from('shared_projects')
        .select(`
          *,
          projects (*)
        `)
        .eq('share_token', shareToken)
        .single();

      if (error) throw error;

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        throw new Error('Share link has expired');
      }

      return { share: data, project: data.projects, error: null };
    } catch (error) {
      console.error('Get project by token error:', error);
      return { share: null, project: null, error };
    }
  },

  /**
   * Auto-save project (silent save without notifications)
   */
  async autoSaveProject(projectId, files, dependencies = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { error: null }; // Silent fail if not authenticated
      }

      const { error } = await supabase
        .from('projects')
        .update({
          files,
          dependencies,
          last_accessed: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Auto-save error:', error);
      return { error };
    }
  },

  /**
   * Subscribe to project changes (real-time)
   */
  subscribeToProject(projectId, callback) {
    const channel = supabase
      .channel(`project:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`,
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};

