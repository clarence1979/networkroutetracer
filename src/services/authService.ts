import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IframeAuthData } from '../types/auth';

const FALLBACK_SUPABASE_URL = 'https://qfitpwdrswvnbmzvkoyd.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmaXRwd2Ryc3d2bmJtenZrb3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNTc4NTIsImV4cCI6MjA3NjkzMzg1Mn0.owLaj3VrcyR7_LW9xMwOTTFQupbDKlvAlVwYtbidiNE';

export class AuthService {
  private supabase: SupabaseClient;

  constructor(url?: string, anonKey?: string) {
    this.supabase = createClient(
      url || FALLBACK_SUPABASE_URL,
      anonKey || FALLBACK_ANON_KEY
    );
  }

  async validateAuthToken(token: string, supabaseUrl: string, supabaseAnonKey: string): Promise<{ username: string; isAdmin: boolean } | null> {
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/auth_tokens?token=eq.${token}&expires_at=gt.${new Date().toISOString()}&select=username,is_admin`,
        {
          headers: {
            'apikey': supabaseAnonKey,
            'Content-Type': 'application/json',
          }
        }
      );

      const tokens = await response.json();

      if (tokens && tokens.length > 0) {
        return {
          username: tokens[0].username,
          isAdmin: tokens[0].is_admin,
        };
      }

      return null;
    } catch (error) {
      console.error('[Auth] Token validation error:', error);
      return null;
    }
  }

  async authenticateUser(username: string, password: string): Promise<{ success: boolean; isAdmin: boolean; openaiApiKey?: string }> {
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

      const isAdmin = username.toLowerCase().includes('admin');

      return {
        success: true,
        isAdmin,
        openaiApiKey,
      };
    } catch {
      return { success: false, isAdmin: false };
    }
  }

  isRunningInIframe(): boolean {
    return window.parent !== window;
  }

  async attemptAutoLogin(): Promise<{
    authenticated: boolean;
    username?: string;
    isAdmin?: boolean;
    openaiApiKey?: string;
  }> {
    return new Promise((resolve) => {
      console.log('[Auth] Attempting auto-login');
      console.log('[Auth] Running in iframe:', this.isRunningInIframe());

      const messageHandler = async (event: MessageEvent) => {
        console.log('[Auth] Received message:', event.data);

        if (event.data.type === 'API_VALUES_RESPONSE') {
          console.log('[Auth] Got API_VALUES_RESPONSE');
          window.removeEventListener('message', messageHandler);

          const { authToken, username, isAdmin, OPENAI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY } = event.data.data;

          if (authToken) localStorage.setItem('authToken', authToken);
          if (username) localStorage.setItem('username', username);
          if (isAdmin !== undefined) localStorage.setItem('isAdmin', String(isAdmin));
          if (OPENAI_API_KEY) localStorage.setItem('OPENAI_API_KEY', OPENAI_API_KEY);
          if (SUPABASE_URL) localStorage.setItem('SUPABASE_URL', SUPABASE_URL);
          if (SUPABASE_ANON_KEY) localStorage.setItem('SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);

          if (authToken && SUPABASE_URL && SUPABASE_ANON_KEY) {
            console.log('[Auth] Validating auth token');
            try {
              const validatedUser = await this.validateAuthToken(authToken, SUPABASE_URL, SUPABASE_ANON_KEY);

              if (validatedUser) {
                console.log('[Auth] Token validated successfully:', validatedUser);
                resolve({
                  authenticated: true,
                  username: validatedUser.username,
                  isAdmin: validatedUser.isAdmin,
                  openaiApiKey: OPENAI_API_KEY,
                });
                return;
              } else {
                console.log('[Auth] Token validation failed');
              }
            } catch (error) {
              console.error('[Auth] Token validation error:', error);
            }
          }

          console.log('[Auth] Authentication failed');
          resolve({ authenticated: false });
        }
      };

      window.addEventListener('message', messageHandler);

      if (this.isRunningInIframe()) {
        console.log('[Auth] Requesting API values from parent');
        window.parent.postMessage({ type: 'REQUEST_API_VALUES' }, '*');
      }

      setTimeout(() => {
        console.log('[Auth] Timeout reached');
        window.removeEventListener('message', messageHandler);

        const storedToken = localStorage.getItem('authToken');
        const storedUsername = localStorage.getItem('username');
        const storedIsAdmin = localStorage.getItem('isAdmin') === 'true';
        const storedOpenAI = localStorage.getItem('OPENAI_API_KEY');

        if (storedToken && storedUsername) {
          console.log('[Auth] Using stored credentials:', storedUsername);
          resolve({
            authenticated: true,
            username: storedUsername,
            isAdmin: storedIsAdmin,
            openaiApiKey: storedOpenAI || undefined,
          });
        } else {
          console.log('[Auth] No stored credentials');
          resolve({ authenticated: false });
        }
      }, 2000);
    });
  }
}

export const authService = new AuthService();
