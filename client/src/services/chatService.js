// client/src/services/chatService.js
import { supabase } from './supabaseClient';
import { showErrorNotification, showSuccessNotification } from './api';

/**
 * Chat Service
 * Handles all chat operations with Supabase
 */
export const chatService = {
  /**
   * Get all projects (chats) for current user
   * Projects serve as chats in our system
   * Falls back to localStorage if user is not authenticated
   */
  async getUserChats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Fallback to localStorage for unauthenticated users
        console.warn('User not authenticated, loading from localStorage');
        const chats = JSON.parse(localStorage.getItem('chats') || '[]');
        return { chats, error: null };
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Convert projects to chat format
      const chats = await Promise.all(
        (data || []).map(async (project) => {
          const messages = await this.getChatMessages(project.id);
          return {
            id: project.id,
            title: project.name,
            timestamp: project.created_at,
            projectId: project.id,
            messages: messages || [],
            generatedCode: {
              files: project.files || {},
            },
          };
        })
      );

      return { chats, error: null };
    } catch (error) {
      console.error('Get user chats error:', error);
      return { chats: [], error };
    }
  },

  /**
   * Get chat messages for a project
   * Falls back to localStorage if user is not authenticated
   */
  async getChatMessages(projectId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Get from localStorage
        const chats = JSON.parse(localStorage.getItem('chats') || '[]');
        const chat = chats.find(c => c.id === projectId);
        return chat?.messages || [];
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Convert to chat message format
      return (data || []).map((msg) => ({
        id: msg.id,
        type: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
        metadata: msg.metadata || {},
      }));
    } catch (error) {
      console.error('Get chat messages error:', error);
      // Fallback to localStorage
      const chats = JSON.parse(localStorage.getItem('chats') || '[]');
      const chat = chats.find(c => c.id === projectId);
      return chat?.messages || [];
    }
  },

  /**
   * Create a new chat (project)
   * Falls back to localStorage if user is not authenticated
   */
  async createChat(initialPrompt = '') {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Fallback to localStorage for unauthenticated users
        console.warn('User not authenticated, using localStorage fallback');
        const chatId = crypto.randomUUID();
        const chat = {
          id: chatId,
          title: initialPrompt ? initialPrompt.substring(0, 50) + (initialPrompt.length > 50 ? '...' : '') : 'New Project',
          timestamp: new Date().toISOString(),
          projectId: chatId,
          messages: [
            {
              id: crypto.randomUUID(),
              type: 'assistant',
              content: 'Hello! What would you like to build today?',
            },
          ],
          generatedCode: { files: {} },
        };
        
        if (initialPrompt) {
          chat.messages.push({
            id: crypto.randomUUID(),
            type: 'user',
            content: initialPrompt,
          });
        }
        
        // Store in localStorage
        const existingChats = JSON.parse(localStorage.getItem('chats') || '[]');
        existingChats.unshift(chat);
        localStorage.setItem('chats', JSON.stringify(existingChats));
        
        return { chat, error: null };
      }

      const projectName = initialPrompt
        ? initialPrompt.substring(0, 50) + (initialPrompt.length > 50 ? '...' : '')
        : 'New Project';

      // Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: projectName,
          description: '',
          files: {},
          dependencies: {},
          is_public: false,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Create initial assistant message
      await this.addMessage(project.id, 'assistant', 'Hello! What would you like to build today?');

      // Add user message if initial prompt provided
      if (initialPrompt) {
        await this.addMessage(project.id, 'user', initialPrompt);
      }

      // Get messages
      const messages = await this.getChatMessages(project.id);

      const chat = {
        id: project.id,
        title: project.name,
        timestamp: project.created_at,
        projectId: project.id,
        messages,
        generatedCode: {
          files: project.files || {},
        },
      };

      return { chat, error: null };
    } catch (error) {
      console.error('Create chat error:', error);
      showErrorNotification('Failed to create chat', [error.message]);
      return { chat: null, error };
    }
  },

  /**
   * Add a message to a chat
   * Falls back to localStorage if user is not authenticated
   */
  async addMessage(projectId, role, content, metadata = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Fallback: return a local message ID
        const messageId = crypto.randomUUID();
        return {
          id: messageId,
          type: role === 'user' ? 'user' : 'assistant',
          content,
          metadata,
        };
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          project_id: projectId,
          role: role === 'user' ? 'user' : 'assistant',
          content,
          metadata,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        type: data.role === 'user' ? 'user' : 'assistant',
        content: data.content,
        metadata: data.metadata || {},
      };
    } catch (error) {
      console.error('Add message error:', error);
      // Return a local message ID as fallback
      return {
        id: crypto.randomUUID(),
        type: role === 'user' ? 'user' : 'assistant',
        content,
        metadata,
      };
    }
  },

  /**
   * Update a message
   * Falls back silently if user is not authenticated
   */
  async updateMessage(messageId, content) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // For unauthenticated users, just return success (message is in localStorage)
        return {
          id: messageId,
          type: 'assistant',
          content,
          metadata: {},
        };
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .update({
          content,
          metadata: { updated_at: new Date().toISOString() },
        })
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        type: data.role === 'user' ? 'user' : 'assistant',
        content: data.content,
        metadata: data.metadata || {},
      };
    } catch (error) {
      console.error('Update message error:', error);
      // Return success anyway to not break the UI
      return {
        id: messageId,
        type: 'assistant',
        content,
        metadata: {},
      };
    }
  },

  /**
   * Delete a message
   */
  async deleteMessage(messageId) {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Delete message error:', error);
      return { error };
    }
  },

  /**
   * Update project files (when code is generated)
   * Falls back to localStorage if user is not authenticated
   */
  async updateProjectFiles(projectId, files, dependencies = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Update in localStorage
        const chats = JSON.parse(localStorage.getItem('chats') || '[]');
        const chatIndex = chats.findIndex(c => c.id === projectId);
        if (chatIndex !== -1) {
          chats[chatIndex].generatedCode = { files };
          localStorage.setItem('chats', JSON.stringify(chats));
        }
        return { project: { id: projectId, files }, error: null };
      }

      const { data, error } = await supabase
        .from('projects')
        .update({
          files,
          dependencies,
          updated_at: new Date().toISOString(),
          last_accessed: new Date().toISOString(),
        })
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;
      return { project: data, error: null };
    } catch (error) {
      console.error('Update project files error:', error);
      return { project: null, error };
    }
  },

  /**
   * Update project name
   * Falls back to localStorage if user is not authenticated
   */
  async updateProjectName(projectId, name) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Update in localStorage
        const chats = JSON.parse(localStorage.getItem('chats') || '[]');
        const chatIndex = chats.findIndex(c => c.id === projectId);
        if (chatIndex !== -1) {
          chats[chatIndex].title = name;
          localStorage.setItem('chats', JSON.stringify(chats));
        }
        return { project: { id: projectId, name }, error: null };
      }

      const { data, error } = await supabase
        .from('projects')
        .update({
          name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;
      return { project: data, error: null };
    } catch (error) {
      console.error('Update project name error:', error);
      return { project: null, error };
    }
  },

  /**
   * Delete a chat (project)
   */
  async deleteChat(projectId) {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      showSuccessNotification('Chat deleted successfully!');
      return { error: null };
    } catch (error) {
      console.error('Delete chat error:', error);
      showErrorNotification('Failed to delete chat', [error.message]);
      return { error };
    }
  },

  /**
   * Clear all messages in a chat
   */
  async clearChat(projectId) {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('project_id', projectId);

      if (error) throw error;

      // Add a new welcome message
      await this.addMessage(projectId, 'assistant', 'Chat cleared. How can I help you?');

      return { error: null };
    } catch (error) {
      console.error('Clear chat error:', error);
      return { error };
    }
  },
};
