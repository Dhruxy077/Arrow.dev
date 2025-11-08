// client/src/services/authService.js
import { supabase } from './supabaseClient';
import { showErrorNotification, showSuccessNotification } from './api';

/**
 * Authentication Service
 * Handles all authentication operations with Supabase
 */
export const authService = {
  /**
   * Sign up with email and password
   */
  async signUp(email, password, fullName = null) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      // Update user profile if fullName provided
      if (fullName && data.user) {
        await supabase
          .from('users')
          .update({ full_name: fullName })
          .eq('id', data.user.id);
      }

      showSuccessNotification('Account created successfully!');
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      showErrorNotification('Failed to create account', [error.message]);
      return { user: null, error };
    }
  },

  /**
   * Sign in with email and password
   */
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      showSuccessNotification('Signed in successfully!');
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      showErrorNotification('Failed to sign in', [error.message]);
      return { user: null, error };
    }
  },

  /**
   * Sign out
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      showSuccessNotification('Signed out successfully!');
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      showErrorNotification('Failed to sign out', [error.message]);
      return { error };
    }
  },

  /**
   * Get current user
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  },

  /**
   * Get user session
   */
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { session, error: null };
    } catch (error) {
      return { session: null, error };
    }
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },

  /**
   * Reset password
   */
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      showSuccessNotification('Password reset email sent!');
      return { error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      showErrorNotification('Failed to send reset email', [error.message]);
      return { error };
    }
  },

  /**
   * Update password
   */
  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      showSuccessNotification('Password updated successfully!');
      return { error: null };
    } catch (error) {
      console.error('Update password error:', error);
      showErrorNotification('Failed to update password', [error.message]);
      return { error };
    }
  },

  /**
   * Get user profile
   */
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { profile: data, error: null };
    } catch (error) {
      return { profile: null, error };
    }
  },

  /**
   * Update user profile
   */
  async updateUserProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      showSuccessNotification('Profile updated successfully!');
      return { profile: data, error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      showErrorNotification('Failed to update profile', [error.message]);
      return { profile: null, error };
    }
  },
};

