export interface User {
  username: string;
  isAdmin: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  openaiApiKey: string | null;
}

export interface IframeAuthData {
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
