// server/services/supabaseService.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase environment variables are not set. Backend features may not work.');
}

// Use service key for admin operations
const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Backend Supabase Service
 * Handles server-side Supabase operations with admin privileges
 */
const supabaseService = {
  /**
   * Get user by ID
   */
  async getUser(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { user: data, error: null };
    } catch (error) {
      return { user: null, error };
    }
  },

  /**
   * Create or update project
   */
  async upsertProject(projectData) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .upsert(projectData, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      return { project: data, error: null };
    } catch (error) {
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
      return { project: null, error };
    }
  },

  /**
   * Save chat message
   */
  async saveChatMessage(projectId, role, content, metadata = {}) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          project_id: projectId,
          role,
          content,
          metadata,
        })
        .select()
        .single();

      if (error) throw error;
      return { message: data, error: null };
    } catch (error) {
      return { message: null, error };
    }
  },

  /**
   * Update project last accessed
   */
  async updateLastAccessed(projectId) {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ last_accessed: new Date().toISOString() })
        .eq('id', projectId);

      return { error };
    } catch (error) {
      return { error };
    }
  },
};

module.exports = { supabase, supabaseService };

