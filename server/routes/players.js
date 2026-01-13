/**
 * Players Routes
 * Handles player registry management
 */

import express from 'express';
import db from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/players - List all players
router.get('/', async (req, res) => {
    try {
        const players = await db.getPlayers();
        res.json(players);
    } catch (err) {
        console.error('Get players error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/players/:id - Update player stats (admin only)
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { stats, rating, position, playStyle } = req.body;

        const updates = {};
        if (stats) updates.stats = stats;
        if (rating) updates.rating = rating;
        if (position) updates.position = position;
        if (playStyle) updates.playStyle = playStyle;

        const updatedPlayer = await db.updatePlayer(id, updates);

        if (updatedPlayer) {
            res.json(updatedPlayer);
        } else {
            res.status(404).json({ error: 'Player not found' });
        }
    } catch (err) {
        console.error('Update player error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
