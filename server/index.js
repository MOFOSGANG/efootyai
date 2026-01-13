/**
 * eFooTyAi Backend Server
 * Express.js server connecting admin panel and main website
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- SERVER STARTUP DIAGNOSTIC ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
    console.log('DEV MODE: Loading variables from .env.local');
} else {
    dotenv.config(); // Load from system environment in production
    console.log('PROD MODE: Using system environment variables');
}

import { connectDB } from './db.js';

import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import postsRoutes from './routes/posts.js';
import playersRoutes from './routes/players.js';
import tacticsRoutes from './routes/tactics.js';
import squadsRoutes from './routes/squads.js';
import alertsRoutes from './routes/alerts.js';
import notificationsRoutes from './routes/notifications.js';
import syncRoutes from './routes/sync.js';
import aiRoutes from './routes/ai.js';
import communityRoutes from './routes/community.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to Database
connectDB();

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'https://efootyai.onrender.com'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Large limit for base64 images
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/players', playersRoutes);
app.use('/api/tactics', tacticsRoutes);
app.use('/api/squads', squadsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/community', communityRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        version: 'v5.1.0-REVOLUTION',
        timestamp: new Date().toISOString()
    });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../dist')));

    // SPA fallback - serve index.html for any non-API, non-file requests
    app.get('*', (req, res, next) => {
        // Skip API routes
        if (req.path.startsWith('/api')) {
            return next();
        }
        // Always serve index.html for SPA routes (let static middleware handle actual files first)
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                    eFooTyAi Backend                        ║
║                   Server Initialized                       ║
╠════════════════════════════════════════════════════════════╣
║  Status:  ONLINE                                           ║
║  Port:    ${PORT}                                             ║
║  API:     http://localhost:${PORT}/api                        ║
║  Time:    ${new Date().toLocaleTimeString()}                                         ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;
