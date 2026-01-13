import { NewsItem, ContentSubmission, Player, MetaTactic } from "../types";

export interface CreatorContent {
  creator: {
    name: string;
    platform: string;
    handle: string;
    url: string;
  };
  content: {
    title: string;
    description: string;
    videoUrl?: string;
    thumbnail?: string;
    type: 'tutorial' | 'gameplay' | 'review' | 'tips';
  };
  aiSummary: string;
}

export class GeminiService {
  private baseUrl = '/api/ai';

  // Provides detailed tactical counter via backend proxy
  async quickStrategy(opponentInfo: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/strategy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opponentInfo })
      });
      const data = await response.json();
      return data.strategy || this.getFallbackStrategy(opponentInfo);
    } catch (e) {
      console.error("Strategy proxy error:", e);
      return this.getFallbackStrategy(opponentInfo);
    }
  }

  // Analyzes voice commentary via backend proxy
  async analyzeVoiceCommentary(commentary: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/commentary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentary })
      });
      const data = await response.json();
      return data.advice || this.getFallbackVoiceAdvice(commentary);
    } catch (e) {
      console.error("Voice proxy error:", e);
      return this.getFallbackVoiceAdvice(commentary);
    }
  }

  // Gets live meta insights via backend proxy
  async getLiveMetaInsights(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/meta`);
      const data = await response.json();
      return typeof data.insights === 'string' ? JSON.parse(data.insights) : data.insights;
    } catch (e) {
      return { bestFormation: "4-2-2-2", bestManager: "G. Gasperini", hottestCard: "Showtime Messi", summary: "Meta focus on physical defensive mids." };
    }
  }

  // Research for F2P/P2W players via backend proxy (Admin only)
  async researchPlayers(category: 'F2P' | 'P2W'): Promise<string> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.baseUrl}/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ category })
      });
      const data = await response.json();
      return data.result || "Research unavailable.";
    } catch (e) {
      return "Research failed. Check connectivity.";
    }
  }

  // Fallbacks kept for resilience
  private getFallbackStrategy(opponentInfo: string): string {
    const fallbacks: Record<string, string> = {
      '4-3-3': `Counter with 4-2-2-2. Use Anchor Man DMF. Drop defensive line to 45.`,
      'default': `Formation: 4-2-2-2 (Balanced). Line: 50. Build: Short Pass.`
    };
    const key = Object.keys(fallbacks).find(k => opponentInfo.toLowerCase().includes(k)) || 'default';
    return fallbacks[key];
  }

  private getFallbackVoiceAdvice(commentary: string): string {
    return "Stay composed. Use match-up defensively, quick passes offensively.";
  }

  // Other methods (screenshot analysis, news scraping) can be moved to proxy if needed
  // For now, focusing on the ones heavily used in the dashboard
  async analyzeSquadScreenshot(base64: string): Promise<{ manager: string; players: any[]; tacticalSummary: string }> {
    // This often exceeds payload limits if not handled carefully, 
    // but we'll use our server-side service if possible or keep a simplified version
    return { manager: "Coach", players: [], tacticalSummary: "AI analysis pending migration." };
  }

  // Generic AI prompt (Admin only)
  async getRealTimeTactics(prompt: string): Promise<string> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.baseUrl}/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt })
      });
      const data = await response.json();
      return data.result || "Oracle is currently offline.";
    } catch (e) {
      return "Oracle sync failed.";
    }
  }

  // Convert post to tactic (Admin only)
  async convertPostToTactic(post: NewsItem): Promise<MetaTactic> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.baseUrl}/convert-tactic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ post })
      });
      const data = await response.json();
      return data.tactic;
    } catch (e) {
      console.error("Conversion fetch error:", e);
      throw e;
    }
  }

  // Sync meta players (Admin only)
  async syncMetaPlayers(): Promise<Player[]> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.baseUrl}/sync-players`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      return data.players || [];
    } catch (e) {
      return [];
    }
  }

  // Discover trending creators (Admin only)
  async discoverTrendingCreators(): Promise<CreatorContent[]> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.baseUrl}/discover-creators`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      return data.creators || [];
    } catch (e) {
      return [];
    }
  }

  // Generate Hub posts from creators (Admin only)
  async generateHubPostsFromCreators(creators: CreatorContent[]): Promise<NewsItem[]> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.baseUrl}/generate-posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ creators })
      });
      const data = await response.json();
      return data.posts || [];
    } catch (e) {
      return [];
    }
  }

  // Sync division tactics (Admin only)
  async syncDivisionTactics(): Promise<MetaTactic[]> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.baseUrl}/sync-tactics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      return data.tactics || [];
    } catch (e) {
      return [];
    }
  }
}

export const geminiService = new GeminiService();
