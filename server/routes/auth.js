/**
 * Authentication Routes
 * Handles user login, signup, and session management
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { authenticate, generateToken } from '../middleware/auth.js';

const router = express.Router();

// Sanitize input
const sanitize = (text) => text.replace(/[<>]/g, '').slice(0, 500);

// Admin password for simple admin panel access
const ADMIN_PASSWORD = 'MOFOSGANG';

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        // Find user by email or username
        let user = await db.getUserByEmail(email) || await db.getUserByUsername(email);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if user is suspended
        if (user.status === 'suspended') {
            return res.status(403).json({ error: 'ACCESS REVOKED' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user);

        // Return user data (without password)
        const userObj = user.toObject();
        const { password: _, ...userWithoutPassword } = userObj;
        res.json({
            token,
            user: userWithoutPassword
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    try {
        const { email, username, efootballName, password } = req.body;

        if (!email || !username || !efootballName || !password) {
            return res.status(400).json({ error: 'All fields required' });
        }

        // Check if user exists
        if (await db.getUserByEmail(email)) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        if (await db.getUserByUsername(username)) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = {
            email: sanitize(email),
            username: sanitize(username),
            efootballName: sanitize(efootballName),
            password: hashedPassword,
            isAdmin: false,
            isVerified: false,
            joinedDate: new Date().toISOString().split('T')[0],
            status: 'active'
        };

        const savedUser = await db.saveUser(newUser);

        // Add notification for admin
        await db.saveNotification({
            type: 'system',
            message: `New Node Initialized: ${savedUser.username}`,
            details: `Registered via ${savedUser.email}`,
            timestamp: new Date().toLocaleTimeString()
        });

        res.status(201).json({ message: 'Account created successfully' });

    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await db.getUserById(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userObj = user.toObject();
        const { password: _, ...userWithoutPassword } = userObj;
        res.json(userWithoutPassword);

    } catch (err) {
        console.error('Get user error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/auth/admin-login - Admin panel login (password only)
router.post('/admin-login', async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'Password required' });
        }

        // Simple password check for admin access
        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Get the root admin user
        let adminUser = await db.getUserByUsername('MOFOSGANG');

        if (!adminUser) {
            // Auto-create root admin if it doesn't exist (first time launch)
            const hashedPassword = await bcrypt.hash('MOFOSGANG', 10);
            adminUser = await db.saveUser({
                email: 'admin@efootyai.mofos',
                username: 'MOFOSGANG',
                password: hashedPassword,
                isAdmin: true,
                isVerified: true,
                joinedDate: new Date().toISOString().split('T')[0],
                status: 'active'
            });
        }

        // Generate token for the admin user
        const token = generateToken(adminUser);

        const userObj = adminUser.toObject();
        const { password: _, ...userWithoutPassword } = userObj;
        res.json({
            token,
            user: userWithoutPassword
        });

    } catch (err) {
        console.error('Admin login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
