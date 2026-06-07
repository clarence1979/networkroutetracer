export interface AuthData {
  username: string;
  isAdmin: boolean;
  authToken?: string;
  OPENAI_API_KEY?: string;
  CLAUDE_API_KEY?: string;
  GEMINI_API_KEY?: string;
  REPLICATE_API_KEY?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}

export interface AutoLoginResult {
  authenticated: boolean;
  username?: string;
  isAdmin?: boolean;
  apiKey?: string;
}

export function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true; // cross-origin top frame blocks access → must be in an iframe
  }
}

export async function attemptAutoLogin(): Promise<AutoLoginResult> {
  console.log('[Auto-Login] Starting...');
  console.log('[Auto-Login] Running in iframe:', isInIframe());

  return new Promise((resolve) => {
    let resolved = false;

    const handleMessage = (event: MessageEvent) => {
      // Reject messages from non-HTTPS origins (security hardening)
      if (!event.origin || !event.origin.startsWith('https://')) return;

      if (event.data?.type === 'API_VALUES_RESPONSE' && !resolved) {
        window.removeEventListener('message', handleMessage);
        resolved = true;

        const authData: AuthData = event.data.data ?? {};
        const {
          username,
          isAdmin,
          OPENAI_API_KEY,
          CLAUDE_API_KEY,
          GEMINI_API_KEY,
          REPLICATE_API_KEY,
          SUPABASE_URL,
          SUPABASE_ANON_KEY,
        } = authData;

        if (username && SUPABASE_URL && SUPABASE_ANON_KEY) {
          localStorage.setItem('VITE_SUPABASE_URL',    SUPABASE_URL);
          localStorage.setItem('VITE_SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);

          if (OPENAI_API_KEY)   localStorage.setItem('VITE_OPENAI_API_KEY',   OPENAI_API_KEY);
          if (CLAUDE_API_KEY)   localStorage.setItem('VITE_CLAUDE_API_KEY',   CLAUDE_API_KEY);
          if (GEMINI_API_KEY)   localStorage.setItem('VITE_GEMINI_API_KEY',   GEMINI_API_KEY);
          if (REPLICATE_API_KEY) localStorage.setItem('VITE_REPLICATE_API_KEY', REPLICATE_API_KEY);

          console.log('[Auto-Login] Success for:', username);

          resolve({
            authenticated: true,
            username,
            isAdmin: isAdmin ?? false,
            apiKey: OPENAI_API_KEY || CLAUDE_API_KEY || GEMINI_API_KEY || '',
          });
          return;
        }

        console.warn('[Auto-Login] Missing required data (username / Supabase credentials)');
        resolve({ authenticated: false });
      }
    };

    window.addEventListener('message', handleMessage);
    // '*' target is intentional — we are only requesting, not sending sensitive data.
    // Origin validation is enforced on the receive side above.
    window.parent.postMessage({ type: 'REQUEST_API_VALUES' }, '*');

    setTimeout(() => {
      if (!resolved) {
        window.removeEventListener('message', handleMessage);
        resolved = true;
        console.warn('[Auto-Login] Timeout');
        resolve({ authenticated: false });
      }
    }, 3000);
  });
}
