interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface LocationData {
  city: string;
  country: string;
  lat: number;
  lng: number;
  ip: string;
}

interface TracerouteHop {
  hop: number;
  ip: string;
  hostname?: string;
  location: {
    city: string;
    country: string;
    lat: number;
    lng: number;
  };
  latency: number;
  organization: string;
  type: 'router' | 'isp' | 'backbone' | 'cdn' | 'destination';
}

export class OpenAIService {
  private apiKey: string;
  private baseURL = 'https://api.openai.com/v1/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest(messages: Array<{ role: string; content: string }>) {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages,
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API Error: ${error.error?.message || 'Unknown error'}`);
    }

    return response.json() as Promise<OpenAIResponse>;
  }

  async getUserLocation(): Promise<LocationData> {
    const messages = [
      {
        role: 'system',
        content: `You are a network geolocation expert. Based on typical internet infrastructure patterns, provide a realistic user location. Return ONLY a JSON object with this exact structure:
{
  "city": "Sydney",
  "country": "Australia", 
  "lat": -33.8688,
  "lng": 151.2093,
  "ip": "203.50.2.100"
}

Use realistic coordinates and a plausible public IP address for the location.`
      },
      {
        role: 'user',
        content: 'Determine my likely location based on typical Australian internet user patterns. Assume I am in a major Australian city.'
      }
    ];

    const response = await this.makeRequest(messages);
    const content = response.choices[0].message.content.trim();
    
    try {
      return JSON.parse(content);
    } catch (error) {
      throw new Error('Failed to parse location data from AI response');
    }
  }

  async performTraceroute(userLocation: LocationData, targetDomain: string): Promise<TracerouteHop[]> {
    const messages = [
      {
        role: 'system',
        content: `You are a network routing expert. Generate a realistic traceroute from the user's location to the target domain. 

Rules:
1. Start from user's location with their ISP
2. Progress through realistic network infrastructure (local ISP → regional backbone → international links → destination ISP → target)
3. Use realistic IP addresses, hostnames, and latencies
4. Include 8-25 hops depending on distance
5. Show geographic progression of the route
6. Use real organization names for ISPs and backbone providers

Return ONLY a JSON array of hops with this exact structure:
[
  {
    "hop": 1,
    "ip": "192.168.1.1",
    "hostname": "home-router.local",
    "location": {"city": "Sydney", "country": "Australia", "lat": -33.8688, "lng": 151.2093},
    "latency": 1,
    "organization": "Home Network",
    "type": "router"
  }
]

Types: "router", "isp", "backbone", "cdn", "destination"
Ensure latency increases realistically with distance.`
      },
      {
        role: 'user',
        content: `Generate a realistic traceroute from ${userLocation.city}, ${userLocation.country} (${userLocation.lat}, ${userLocation.lng}) to ${targetDomain}. 

Consider:
- Geographic distance and routing paths
- Real ISPs and backbone providers in the regions
- Submarine cables for international routes
- Realistic latencies (local: 1-50ms, regional: 50-150ms, international: 150-400ms)
- Proper network hierarchy progression`
      }
    ];

    const response = await this.makeRequest(messages);
    const content = response.choices[0].message.content.trim();
    
    try {
      const hops = JSON.parse(content);
      return hops.map((hop: any, index: number) => ({
        ...hop,
        id: index + 1,
        hop: index + 1
      }));
    } catch (error) {
      throw new Error('Failed to parse traceroute data from AI response');
    }
  }

  async resolveTargetLocation(domain: string): Promise<LocationData> {
    const messages = [
      {
        role: 'system',
        content: `You are a DNS and hosting expert. Determine the likely server location for a given domain based on known hosting patterns, CDN locations, and major service providers.

Return ONLY a JSON object with this exact structure:
{
  "city": "San Francisco",
  "country": "United States",
  "lat": 37.7749,
  "lng": -122.4194,
  "ip": "142.250.66.206"
}

Use realistic coordinates and IP addresses for major hosting locations.`
      },
      {
        role: 'user',
        content: `Determine the most likely server location for ${domain}. Consider:
- Major cloud providers (AWS, Google Cloud, Azure, Cloudflare)
- CDN edge locations
- Company headquarters locations
- Regional hosting patterns`
      }
    ];

    const response = await this.makeRequest(messages);
    const content = response.choices[0].message.content.trim();
    
    try {
      return JSON.parse(content);
    } catch (error) {
      throw new Error('Failed to parse target location data from AI response');
    }
  }
}