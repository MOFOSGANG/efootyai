import express from 'express';
import db from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/community/leaderboard - Get top users
router.get('/leaderboard', async (req, res) => {
    try {
        const users = await db.getLeaderboard();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/community/profile/:username - Get user profile
router.get('/profile/:username', async (req, res) => {
    try {
        const user = await db.getUserByUsername(req.params.username);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const userObj = user.toObject();
        delete userObj.password;
        res.json(userObj);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/community/profile - Update own profile
router.patch('/profile', authenticate, async (req, res) => {
    try {
        const { bio, efootballName } = req.body;
        const updatedUser = await db.updateUser(req.user.id, { bio, efootballName });

        const userObj = updatedUser.toObject();
        delete userObj.password;
        res.json(userObj);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/community/like/:postId - Like a post
router.post('/like/:postId', authenticate, async (req, res) => {
    try {
        const post = await db.likePost(req.params.postId, req.user.id);
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/community/unlike/:postId - Unlike a post
router.post('/unlike/:postId', authenticate, async (req, res) => {
    try {
        const post = await db.unlikePost(req.params.postId, req.user.id);
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/community/view/:postId - Record a view
router.post('/view/:postId', async (req, res) => {
    try {
        await db.recordView(req.params.postId);
        res.sendStatus(200);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
