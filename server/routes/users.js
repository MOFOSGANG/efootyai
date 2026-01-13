/**
 * User Management Routes (Admin Only)
 * Handles user listing, verification, and suspension
 */

import express from 'express';
import db from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/users - List all users (admin only)
router.get('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const users = await db.getUsers();
        const usersWithoutPasswords = users.map(u => {
            const userObj = u.toObject();
            const { password, ...userWithoutPassword } = userObj;
            return userWithoutPassword;
        });
        res.json(usersWithoutPasswords);
    } catch (err) {
        console.error('Get users error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/users/:id - Update user (admin only)
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body;

        const user = await db.getUserById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let updates = {};

        if (action === 'verify') {
            updates.isVerified = !user.isVerified;
        } else if (action === 'suspend') {
            updates.status = user.status === 'active' ? 'suspended' : 'active';
        } else {
            // Allow direct updates for other fields
            const { isVerified, status, isAdmin } = req.body;
            if (isVerified !== undefined) updates.isVerified = isVerified;
            if (status !== undefined) updates.status = status;
            // Prevent removing admin from root admin
            if (isAdmin !== undefined && user.username !== 'MOFOSGANG') updates.isAdmin = isAdmin;
        }

        const updatedUser = await db.updateUser(id, updates);

        if (updatedUser) {
            // Add notification
            await db.saveNotification({
                type: 'system',
                message: `User ${updatedUser.username} ${action === 'verify' ? (updatedUser.isVerified ? 'verified' : 'unverified') : (updatedUser.status === 'suspended' ? 'suspended' : 'reactivated')}`,
                details: `Action taken by admin`,
                timestamp: new Date().toLocaleTimeString()
            });

            const userObj = updatedUser.toObject();
            const { password, ...userWithoutPassword } = userObj;
            res.json(userWithoutPassword);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        console.error('Update user error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
