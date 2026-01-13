/**
 * Squads Routes
 * Handles squad builder management
 */

import express from 'express';
import db from '../db.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/squads - List squads
router.get('/', optionalAuth, async (req, res) => {
    try {
        const squads = await db.getSquads();
        res.json(squads);
    } catch (err) {
        console.error('Get squads error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/squads/:id - Update squad
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, manager, coachSkill, players, screenshot, lastAnalysis } = req.body;

        const squadData = {
            id,
            name,
            manager,
            coachSkill,
            players,
            screenshot,
            lastAnalysis
        };

        const updatedSquad = await db.saveSquad(squadData);

        if (updatedSquad) {
            res.json(updatedSquad);
        } else {
            res.status(404).json({ error: 'Squad not found' });
        }
    } catch (err) {
        console.error('Update squad error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
