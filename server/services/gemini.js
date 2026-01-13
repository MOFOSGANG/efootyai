import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || '');

export const geminiService = {
    // Provides detailed tactical counter
    async quickStrategy(opponentInfo) {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `You are an elite eFootball 2025 Division 1 coach. 
      Opponent setup: ${opponentInfo || 'Standard meta'}
      
      Provide a DETAILED tactical counter strategy. Include:
      1. FORMATION: Best counter formation
      2. DEFENSIVE SETUP: Line depth, pressing intensity
      3. OFFENSIVE APPROACH: Build-up style
      4. PLAYER INSTRUCTIONS: 2-3 specific role adjustments
      5. IN-GAME TIPS: Real-time adjustments
      
      Keep response under 150 words but make it actionable and specific. Use eFootball terms.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (err) {
            console.error('Gemini error:', err);
            return "Focus on holding the ball and using manual cursor changes to intercept passes.";
        }
    },

    // Analyzes voice commentary
    async analyzeVoiceCommandary(commentary) {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `Player commentary mid-match: "${commentary}"
      Provide quick tactical advice (15-25 words). Direct and specific. Use eFootball terms.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (err) {
            return "Stay composed. Use match-up defensively, quick passes offensively.";
        }
    },

    // Gets live meta insights
    async getLiveMetaInsights() {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = "Scrape current eFootball 2025 meta: Best Formation, Most used Manager, Hottest Player Card. Return as JSON.";

            const result = await model.generateContent(prompt);
            const response = await result.response;
            // Note: In real app, we'd use responseSchema or JSON parsing
            return response.text();
        } catch (err) {
            return JSON.stringify({ bestFormation: "4-2-2-2", bestManager: "L. Roman", hottestCard: "Showtime Messi" });
        }
    },

    // Research for F2P/P2W players
    async researchPlayers(category) {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `Research best ${category} players (Standard, Event, or Featured) in eFootball 2025. List 5 players with brief reasons.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (err) {
            return "Research failed. Check meta trends manually.";
        }
    },

    // Generic prompt for real-time tactics
    async getRealTimeTactics(prompt) {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (err) {
            console.error('Real-time tactics error:', err);
            return "Unable to fetch real-time tactics.";
        }
    },

    // Convert a post to a structured tactic
    async convertPostToTactic(post) {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `Convert this eFootball content into a structured meta tactic JSON:
            Title: ${post.title}
            Summary: ${post.summary}
            Category: ${post.category}
            
            Return ONLY a JSON object with: title, author, formation, description, difficulty (Beginner/Advanced/Pro).`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            // Basic JSON extraction
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

            return {
                id: `TAC-${Date.now()}`,
                title: data.title || post.title,
                author: data.author || post.author,
                formation: data.formation || "Adaptive",
                description: data.description || post.summary,
                difficulty: data.difficulty || "Beginner",
                sourcePostId: post.id
            };
        } catch (err) {
            console.error('Conversion error:', err);
            return {
                id: `TAC-${Date.now()}`,
                title: post.title,
                author: post.author,
                formation: "Adaptive",
                description: post.summary,
                difficulty: "Beginner",
                sourcePostId: post.id
            };
        }
    },

    // Sync meta players
    async syncMetaPlayers() {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `Find 5 current meta players in eFootball 2025. 
            Return ONLY a JSON array of objects with: name, rating (number), position, playStyle (Goal Poacher, Hole Player, etc), club, nationality, stats (object with offensive, defensive, speed, physical, passing as numbers).`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            const players = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

            return players.map((p, idx) => ({
                id: `SYNC-PL-${Date.now()}-${idx}`,
                ...p,
                image: "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=400&h=400&fit=crop"
            }));
        } catch (err) {
            console.error('Player sync error:', err);
            return [];
        }
    },

    // Discover trending creators
    async discoverTrendingCreators() {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `List 3 trending eFootball 2025 content creators. 
            Return ONLY a JSON array of objects with: creator (name, platform, handle, url), content (title, description, type: tutorial/gameplay/review/tips), aiSummary.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        } catch (err) {
            console.error('Creator discovery error:', err);
            return [];
        }
    },

    // Generate posts from creators
    async generateHubPostsFromCreators(creators) {
        return creators.map((c, idx) => ({
            id: `AUTO-POST-${Date.now()}-${idx}`,
            title: c.content.title,
            summary: c.aiSummary,
            category: 'News',
            url: c.creator.url,
            author: c.creator.name,
            timestamp: new Date().toISOString(),
            status: 'pending'
        }));
    },

    // Sync division tactics
    async syncDivisionTactics() {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `Find 3 current Division 1 meta tactics for eFootball 2025.
            Return ONLY a JSON array of objects with: title, author, formation, description, difficulty.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            const tactics = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

            return tactics.map((t, idx) => ({
                id: `SYNC-TAC-${Date.now()}-${idx}`,
                ...t
            }));
        } catch (err) {
            console.error('Tactics sync error:', err);
            return [];
        }
    }
};
