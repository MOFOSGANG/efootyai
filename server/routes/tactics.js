/**
 * Tactics Routes
 * Handles tactical playbooks management
 */

import express from 'express';
import db from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/tactics - List all tactics
router.get('/', async (req, res) => {
    try {
        const tactics = await db.getTactics();
        res.json(tactics);
    } catch (err) {
        console.error('Get tactics error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/tactics - Add new tactic
router.post('/', authenticate, async (req, res) => {
    try {
        const { title, formation, description, difficulty, sourcePostId } = req.body;

        if (!title || !formation || !description) {
            return res.status(400).json({ error: 'Title, formation, and description required' });
        }

        const newTacticData = {
            title,
            author: req.user.username,
            formation,
            description,
            difficulty: difficulty || 'Advanced',
            sourcePostId: sourcePostId || null
        };

        const savedTactic = await db.saveTactic(newTacticData);

        // Add notification
        await db.saveNotification({
            type: 'system',
            message: `Tactical Breakthrough: ${savedTactic.title}`,
            details: `New tactic added by ${req.user.username}`,
            timestamp: new Date().toLocaleTimeString()
        });

        res.status(201).json(savedTactic);
    } catch (err) {
        console.error('Create tactic error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
