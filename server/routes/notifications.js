/**
 * Notifications Routes
 * Handles system notifications/transmission logs
 */

import express from 'express';
import db from '../db.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/notifications - List notifications
router.get('/', optionalAuth, async (req, res) => {
    try {
        const notifications = await db.getNotifications();
        res.json(notifications);
    } catch (err) {
        console.error('Get notifications error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/notifications - Add notification
router.post('/', authenticate, async (req, res) => {
    try {
        const { type, message, details } = req.body;

        if (!type || !message) {
            return res.status(400).json({ error: 'Type and message required' });
        }

        const notificationData = {
            type,
            message,
            details: details || '',
            timestamp: new Date().toLocaleTimeString()
        };

        const notification = await db.saveNotification(notificationData);
        res.status(201).json(notification);
    } catch (err) {
        console.error('Add notification error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
