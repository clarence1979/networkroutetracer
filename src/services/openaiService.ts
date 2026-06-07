// ── Types ─────────────────────────────────────────────────────────

interface OpenAIResponse {
  choices: Array<{ message: { content: string } }>;
}

export interface LocationData {
  city: string;
  country: string;
  lat: number;
  lng: number;
  ip: string;
}

export interface TracerouteHop {
  hop: number;
  ip: string;
  hostname?: string;
  location: { city: string; country: string; lat: number; lng: number };
  latency: number;
  organization: string;
  type: 'router' | 'isp' | 'backbone' | 'cdn' | 'destination';
}

// ── Model discovery ───────────────────────────────────────────────

const MODEL_CACHE_KEY = 'openai_model_v2';
const MODEL_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 h

// Patterns that identify chat-completion capable models
const CHAT_INCLUDE = /^(gpt-4|gpt-3\.5-turbo|chatgpt-4o|o[1-9])/;
// Patterns to exclude non-chat models
const CHAT_EXCLUDE = /embed|whisper|dall-e|tts|realtime|audio|transcri|search|vision-preview/i;

interface ModelEntry { id: string; created: number; owned_by: string }

function pickBestModel(models: ModelEntry[]): string {
  const candidates = models.filter(
    m => CHAT_INCLUDE.test(m.id) && !CHAT_EXCLUDE.test(m.id) && m.owned_by === 'openai',
  );

  // Prefer GPT-4 family (great at JSON, predictable params) over o-series reasoning models
  const gpt4 = candidates.filter(m => /^(gpt-4|chatgpt-4o)/.test(m.id));
  const pool  = gpt4.length ? gpt4 : candidates;

  pool.sort((a, b) => b.created - a.created);
  return pool[0]?.id ?? 'gpt-4o';
}

export async function fetchLatestModel(apiKey: string): Promise<string> {
  // 1. Check session cache
  try {
    const raw = sessionStorage.getItem(MODEL_CACHE_KEY);
    if (raw) {
      const { model, ts } = JSON.parse(raw) as { model: string; ts: number };
      if (Date.now() - ts < MODEL_CACHE_TTL) return model;
    }
  } catch (_) { /* corrupt cache */ }

  // 2. Fetch live model list from OpenAI
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) {
      const { data } = (await res.json()) as { data: ModelEntry[] };
      const model = pickBestModel(data);
      try {
        sessionStorage.setItem(MODEL_CACHE_KEY, JSON.stringify({ model, ts: Date.now() }));
      } catch (_) { /* quota exceeded */ }
      return model;
    }
  } catch (_) { /* network error – fall through to default */ }

  return 'gpt-4o'; // safe fallback (OpenAI keeps this alias updated)
}

// ── Service ───────────────────────────────────────────────────────

export class OpenAIService {
  private readonly apiKey: string;
  private modelId: string | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /** Resolves (and caches) the best available model for this API key. */
  async getModel(): Promise<string> {
    if (!this.modelId) this.modelId = await fetchLatestModel(this.apiKey);
    return this.modelId;
  }

  /** Synchronously returns the cached model id (null if not yet resolved). */
  get resolvedModel(): string | null {
    return this.modelId;
  }

  private async makeRequest(
    messages: Array<{ role: string; content: string }>,
    jsonMode = false,
  ): Promise<OpenAIResponse> {
    const model = await this.getModel();

    // o-series reasoning models have different parameter requirements
    const isOSeries = /^o[1-9]/.test(model);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: Record<string, any> = { model, messages };

    if (isOSeries) {
      // o-series: no temperature, uses max_completion_tokens
      body.max_completion_tokens = 2000;
    } else {
      body.temperature = 0.1;
      body.max_tokens  = 2000;
      // JSON mode: gpt-4-turbo and gpt-4o family support response_format
      if (jsonMode && /gpt-4[o\-]/.test(model)) {
        body.response_format = { type: 'json_object' };
      }
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`OpenAI API Error: ${err.error?.message ?? 'Unknown error'}`);
    }

    return response.json();
  }

  // ── Task methods ────────────────────────────────────────────────

  async getUserLocation(): Promise<LocationData> {
    const res = await this.makeRequest([
      {
        role: 'system',
        content: `You are a network geolocation expert. Return ONLY a JSON object:
{"city":"Sydney","country":"Australia","lat":-33.8688,"lng":151.2093,"ip":"203.50.2.100"}
Use realistic coordinates and a plausible public IP for a major Australian city.`,
      },
      {
        role: 'user',
        content: 'Determine a likely Australian internet user location. Pick a major city.',
      },
    ], true);

    const text = res.choices[0].message.content.trim();
    const json = text.startsWith('{') ? text : text.match(/\{[\s\S]*\}/)?.[0] ?? text;
    return JSON.parse(json);
  }

  async resolveTargetLocation(domain: string): Promise<LocationData> {
    const res = await this.makeRequest([
      {
        role: 'system',
        content: `You are a DNS and hosting expert. Return ONLY a JSON object:
{"city":"San Francisco","country":"United States","lat":37.7749,"lng":-122.4194,"ip":"142.250.66.206"}
Use realistic server coordinates for major cloud providers, CDNs, or company HQs.`,
      },
      {
        role: 'user',
        content: `Determine the most likely server location for ${domain}. Consider AWS, Google Cloud, Azure, Cloudflare, and CDN patterns.`,
      },
    ], true);

    const text = res.choices[0].message.content.trim();
    const json = text.startsWith('{') ? text : text.match(/\{[\s\S]*\}/)?.[0] ?? text;
    return JSON.parse(json);
  }

  async performTraceroute(userLocation: LocationData, targetDomain: string): Promise<TracerouteHop[]> {
    const res = await this.makeRequest([
      {
        role: 'system',
        content: `You are a network routing expert. Generate a realistic traceroute and return ONLY a JSON array:
[{"hop":1,"ip":"192.168.1.1","hostname":"home-router.local","location":{"city":"Sydney","country":"Australia","lat":-33.8688,"lng":151.2093},"latency":1,"organization":"Home Network","type":"router"}]

Rules:
- 8–25 hops; start at user's ISP, end at destination
- Types: "router" | "isp" | "backbone" | "cdn" | "destination"
- Use real ISP/backbone names and realistic IPs
- Latency increases with distance (local: 1–50 ms, regional: 50–150 ms, international: 150–400 ms)`,
      },
      {
        role: 'user',
        content: `Traceroute from ${userLocation.city}, ${userLocation.country} (${userLocation.lat}, ${userLocation.lng}) to ${targetDomain}.
Include geographic progression, real backbone providers, and submarine cables for international routes.`,
      },
    ], true);

    const text  = res.choices[0].message.content.trim();
    const json  = text.startsWith('[') ? text : text.match(/\[[\s\S]*\]/)?.[0] ?? text;
    const hops  = JSON.parse(json);
    return hops.map((h: TracerouteHop, i: number) => ({ ...h, id: i + 1, hop: i + 1 }));
  }
}
