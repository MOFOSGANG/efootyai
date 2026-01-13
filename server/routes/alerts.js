/**
 * Global Alerts Routes
 * Handles system-wide alert broadcasting
 */

import express from 'express';
import db from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/alerts - Get current global alert
router.get('/', async (req, res) => {
    try {
        const alert = await db.getAlert();
        res.json(alert);
    } catch (err) {
        console.error('Get alert error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/alerts - Set global alert (admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const { message, type, active } = req.body;

        const alertData = {
            id: 'a1',
            message: message || '',
            type: type || 'info',
            active: active !== false
        };

        const alert = await db.saveAlert(alertData);
        res.json(alert);
    } catch (err) {
        console.error('Set alert error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/alerts - Clear global alert (admin only)
router.delete('/', authenticate, requireAdmin, async (req, res) => {
    try {
        await db.saveAlert({ id: 'a1', message: '', active: false });
        res.json({ message: 'Alert cleared' });
    } catch (err) {
        console.error('Clear alert error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
