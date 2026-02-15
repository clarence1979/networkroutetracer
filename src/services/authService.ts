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
      const isInIframe = this.isRunningInIframe();
      console.log('[Auth] Running in iframe:', isInIframe);

      if (!isInIframe) {
        console.log('[Auth] Not in iframe, skipping auto-login');
        resolve(null);
        return;
      }

      const handleMessage = (event: MessageEvent) => {
        console.log('[Auth] Received message:', event.data);

        if (event.data.type === 'API_VALUES_RESPONSE') {
          console.log('[Auth] Got API_VALUES_RESPONSE');
          window.removeEventListener('message', handleMessage);
          resolve(event.data.data);
        }
      };

      window.addEventListener('message', handleMessage);
      console.log('[Auth] Requesting API values from parent');
      window.parent.postMessage({ type: 'REQUEST_API_VALUES' }, '*');

      setTimeout(() => {
        console.log('[Auth] Timeout reached, no response from parent');
        window.removeEventListener('message', handleMessage);
        resolve(null);
      }, 3000);
    });
  }

  async attemptAutoLogin(): Promise<{
    authenticated: boolean;
    username?: string;
    isAdmin?: boolean;
    openaiApiKey?: string;
  }> {
    console.log('[Auth] Attempting auto-login');
    const iframeData = await this.requestIframeAuth();

    if (!iframeData) {
      console.log('[Auth] No iframe data received');
      return { authenticated: false };
    }

    console.log('[Auth] Iframe data received:', {
      hasAuthToken: !!iframeData.authToken,
      hasOpenAI: !!iframeData.OPENAI_API_KEY,
      username: iframeData.username,
    });

    const supabaseUrl = iframeData.SUPABASE_URL || FALLBACK_SUPABASE_URL;
    const supabaseAnonKey = iframeData.SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

    const authService = new AuthService(supabaseUrl, supabaseAnonKey);

    if (iframeData.authToken) {
      console.log('[Auth] Validating auth token');
      const validatedUser = await authService.validateAuthToken(iframeData.authToken);

      if (validatedUser) {
        console.log('[Auth] Token validated successfully:', validatedUser);
        return {
          authenticated: true,
          username: validatedUser.username,
          isAdmin: validatedUser.isAdmin,
          openaiApiKey: iframeData.OPENAI_API_KEY,
        };
      } else {
        console.log('[Auth] Token validation failed');
      }
    } else {
      console.log('[Auth] No auth token in iframe data');
    }

    return { authenticated: false };
  }
}

export const authService = new AuthService();
