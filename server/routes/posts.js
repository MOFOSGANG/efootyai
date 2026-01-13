/**
 * Posts/News Routes
 * Handles content creation, moderation, and listing
 */

import express from 'express';
import db from '../db.js';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/posts - List posts
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { status } = req.query;
        let posts = await db.getPosts();

        // Filter by status if provided
        if (status) {
            posts = posts.filter(p => p.status === status);
        } else if (!req.user?.isAdmin) {
            // Non-admins only see approved posts
            posts = posts.filter(p => p.status === 'approved');
        }

        res.json(posts);
    } catch (err) {
        console.error('Get posts error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/posts - Create new post
router.post('/', authenticate, async (req, res) => {
    try {
        const { title, content, category, image, videoUrl } = req.body;

        if (!title || !content || !category) {
            return res.status(400).json({ error: 'Title, content, and category required' });
        }

        const newPostData = {
            title,
            content,
            author: req.user.username,
            category,
            image: image || null,
            videoUrl: videoUrl || null,
            status: 'pending'
        };

        const savedPost = await db.savePost(newPostData);

        // Add notification
        await db.saveNotification({
            type: 'system',
            message: `INTEL RECEIVED: ${savedPost._id}`,
            details: `Transmission from node ${req.user.username} is in quarantine for final validation.`,
            timestamp: new Date().toLocaleTimeString()
        });

        res.status(201).json(savedPost);
    } catch (err) {
        console.error('Create post error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/posts/:id - Update post (approve/reject)
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['approved', 'pending'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updatedPost = await db.updatePost(id, status);

        if (updatedPost) {
            res.json(updatedPost);
        } else {
            res.status(404).json({ error: 'Post not found' });
        }
    } catch (err) {
        console.error('Update post error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/posts/:id - Delete post
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await db.deletePost(id);
        res.json({ message: 'Post deleted' });
    } catch (err) {
        console.error('Delete post error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
