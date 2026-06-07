import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IframeAuthData } from '../types/auth';

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
      const messageHandler = async (event: MessageEvent) => {
        // Reject messages from insecure (non-HTTPS) origins to prevent
        // message injection from attacker-controlled HTTP pages.
        if (!event.origin || !event.origin.startsWith('https://')) return;

        if (event.data?.type === 'API_VALUES_RESPONSE') {
          window.removeEventListener('message', messageHandler);

          const {
            authToken, username, isAdmin,
            OPENAI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY,
          } = event.data.data ?? {};

          if (authToken)       localStorage.setItem('authToken',       authToken);
          if (username)        localStorage.setItem('username',        username);
          if (isAdmin !== undefined) localStorage.setItem('isAdmin',   String(isAdmin));
          if (OPENAI_API_KEY)  localStorage.setItem('OPENAI_API_KEY',  OPENAI_API_KEY);
          if (SUPABASE_URL)    localStorage.setItem('SUPABASE_URL',    SUPABASE_URL);
          if (SUPABASE_ANON_KEY) localStorage.setItem('SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);

          if (authToken && SUPABASE_URL && SUPABASE_ANON_KEY) {
            try {
              const validatedUser = await this.validateAuthToken(
                authToken, SUPABASE_URL, SUPABASE_ANON_KEY,
              );

              if (validatedUser) {
                resolve({
                  authenticated: true,
                  username:      validatedUser.username,
                  isAdmin:       validatedUser.isAdmin,
                  openaiApiKey:  OPENAI_API_KEY,
                });
                return;
              }
            } catch (error) {
              console.error('[Auth] Token validation error:', error);
            }
          }

          resolve({ authenticated: false });
        }
      };

      window.addEventListener('message', messageHandler);

      if (this.isRunningInIframe()) {
        // '*' target is intentional: we are only requesting (not sending) data.
        // Origin validation is enforced on the receive side above.
        window.parent.postMessage({ type: 'REQUEST_API_VALUES' }, '*');
      }

      setTimeout(() => {
        window.removeEventListener('message', messageHandler);

        const storedToken    = localStorage.getItem('authToken');
        const storedUsername = localStorage.getItem('username');
        const storedIsAdmin  = localStorage.getItem('isAdmin') === 'true';
        const storedOpenAI   = localStorage.getItem('OPENAI_API_KEY');

        if (storedToken && storedUsername) {
          resolve({
            authenticated: true,
            username:      storedUsername,
            isAdmin:       storedIsAdmin,
            openaiApiKey:  storedOpenAI || undefined,
          });
        } else {
          resolve({ authenticated: false });
        }
      }, 2000);
    });
  }
}

export const authService = new AuthService();
