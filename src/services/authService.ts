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

  async validateAuthToken(token: string): Promise<{ username: string; isAdmin: boolean } | null> {
    try {
      const { data, error } = await this.supabase
        .from('auth_tokens')
        .select('username, is_admin, expires_at')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return {
        username: data.username,
        isAdmin: data.is_admin,
      };
    } catch {
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
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  }

  async requestIframeAuth(): Promise<IframeAuthData | null> {
    return new Promise((resolve) => {
      if (!this.isRunningInIframe()) {
        resolve(null);
        return;
      }

      window.parent.postMessage({ type: 'REQUEST_API_VALUES' }, '*');

      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'API_VALUES_RESPONSE') {
          window.removeEventListener('message', handleMessage);
          resolve(event.data.data);
        }
      };

      window.addEventListener('message', handleMessage);

      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        resolve(null);
      }, 2000);
    });
  }

  async attemptAutoLogin(): Promise<{
    authenticated: boolean;
    username?: string;
    isAdmin?: boolean;
    openaiApiKey?: string;
  }> {
    const iframeData = await this.requestIframeAuth();

    if (!iframeData) {
      return { authenticated: false };
    }

    const supabaseUrl = iframeData.SUPABASE_URL || FALLBACK_SUPABASE_URL;
    const supabaseAnonKey = iframeData.SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

    const authService = new AuthService(supabaseUrl, supabaseAnonKey);

    if (iframeData.authToken) {
      const validatedUser = await authService.validateAuthToken(iframeData.authToken);

      if (validatedUser) {
        return {
          authenticated: true,
          username: validatedUser.username,
          isAdmin: validatedUser.isAdmin,
          openaiApiKey: iframeData.OPENAI_API_KEY,
        };
      }
    }

    return { authenticated: false };
  }
}

export const authService = new AuthService();
