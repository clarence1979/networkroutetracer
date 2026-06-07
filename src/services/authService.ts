import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Auth Supabase project credentials (anon/public key — safe in client bundles)
const AUTH_SUPABASE_URL     = import.meta.env.VITE_AUTH_SUPABASE_URL     as string;
const AUTH_SUPABASE_ANON_KEY = import.meta.env.VITE_AUTH_SUPABASE_ANON_KEY as string;

export class AuthService {
  private supabase: SupabaseClient;

  constructor(url?: string, anonKey?: string) {
    this.supabase = createClient(
      url     || AUTH_SUPABASE_URL,
      anonKey || AUTH_SUPABASE_ANON_KEY,
    );
  }

  async validateAuthToken(
    token: string,
    supabaseUrl: string,
    supabaseAnonKey: string,
  ): Promise<{ username: string; isAdmin: boolean } | null> {
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/auth_tokens?token=eq.${encodeURIComponent(token)}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=username,is_admin`,
        {
          headers: {
            apikey: supabaseAnonKey,
            'Content-Type': 'application/json',
          },
        },
      );

      const tokens = await response.json();

      if (Array.isArray(tokens) && tokens.length > 0) {
        return {
          username: tokens[0].username,
          isAdmin:  tokens[0].is_admin,
        };
      }

      return null;
    } catch (error) {
      console.error('[Auth] Token validation error:', error);
      return null;
    }
  }

  async authenticateUser(
    username: string,
    password: string,
  ): Promise<{ success: boolean; isAdmin: boolean; openaiApiKey?: string }> {
    try {
      const { data: users, error: userError } = await this.supabase
        .from('users_login')
        .select('username, password')
        .eq('username', username)
        .eq('password', password)
        .maybeSingle();

      if (userError || !users) {
        return { success: false, isAdmin: false };
      }

      const { data: secrets } = await this.supabase
        .from('secrets')
        .select('key_value')
        .eq('key_name', 'OPENAI_API_KEY')
        .maybeSingle();

      const openaiApiKey = secrets?.key_value || undefined;
      const isAdmin      = username.toLowerCase().includes('admin');

      return { success: true, isAdmin, openaiApiKey };
    } catch {
      return { success: false, isAdmin: false };
    }
  }
}

export const authService = new AuthService();
