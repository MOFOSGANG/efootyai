import express from 'express';
import { geminiService } from '../services/gemini.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// POST /api/ai/strategy - Get tactical strategy
router.post('/strategy', async (req, res) => {
    try {
        const { opponentInfo } = req.body;
        const strategy = await geminiService.quickStrategy(opponentInfo);
        res.json({ strategy });
    } catch (err) {
        res.status(500).json({ error: 'AI Error' });
    }
});

// POST /api/ai/commentary - Analyze voice commentary
router.post('/commentary', async (req, res) => {
    try {
        const { commentary } = req.body;
        const advice = await geminiService.analyzeVoiceCommandary(commentary);
        res.json({ advice });
    } catch (err) {
        res.status(500).json({ error: 'AI Error' });
    }
});

// GET /api/ai/meta - Get live meta insights
router.get('/meta', async (req, res) => {
    try {
        const insights = await geminiService.getLiveMetaInsights();
        res.json({ insights });
    } catch (err) {
        res.status(500).json({ error: 'AI Error' });
    }
});

// POST /api/ai/research - Research players (Admin only)
router.post('/research', authenticate, requireAdmin, async (req, res) => {
    try {
        const { category } = req.body;
        const result = await geminiService.researchPlayers(category);
        res.json({ result });
    } catch (err) {
        res.status(500).json({ error: 'AI Error' });
    }
});

// POST /api/ai/prompt - Generic AI prompt (Admin only)
router.post('/prompt', authenticate, requireAdmin, async (req, res) => {
    try {
        const { prompt } = req.body;
        const result = await geminiService.getRealTimeTactics(prompt);
        res.json({ result });
    } catch (err) {
        res.status(500).json({ error: 'AI Error' });
    }
});

// POST /api/ai/convert-tactic - Convert post to tactic (Admin only)
router.post('/convert-tactic', authenticate, requireAdmin, async (req, res) => {
    try {
        const { post } = req.body;
        const tactic = await geminiService.convertPostToTactic(post);
        res.json({ tactic });
    } catch (err) {
        res.status(500).json({ error: 'AI Error' });
    }
});

// GET /api/ai/sync-players - Sync meta players (Admin only)
router.get('/sync-players', authenticate, requireAdmin, async (req, res) => {
    try {
        const players = await geminiService.syncMetaPlayers();
        res.json({ players });
    } catch (err) {
        res.status(500).json({ error: 'AI Error' });
    }
});

// GET /api/ai/discover-creators - Discover creators (Admin only)
router.get('/discover-creators', authenticate, requireAdmin, async (req, res) => {
    try {
        const creators = await geminiService.discoverTrendingCreators();
        res.json({ creators });
    } catch (err) {
        res.status(500).json({ error: 'AI Error' });
    }
});

// POST /api/ai/generate-posts - Generate posts from creators (Admin only)
router.post('/generate-posts', authenticate, requireAdmin, async (req, res) => {
    try {
        const { creators } = req.body;
        const posts = await geminiService.generateHubPostsFromCreators(creators);
        res.json({ posts });
    } catch (err) {
        res.status(500).json({ error: 'AI Error' });
    }
});

// GET /api/ai/sync-tactics - Sync division tactics (Admin only)
router.get('/sync-tactics', authenticate, requireAdmin, async (req, res) => {
    try {
        const tactics = await geminiService.syncDivisionTactics();
        res.json({ tactics });
    } catch (err) {
        res.status(500).json({ error: 'AI Error' });
    }
});

export default router;
