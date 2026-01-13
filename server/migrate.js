import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { User } from './models/User.js';
import { Post } from './models/Post.js';
import { Player } from './models/Player.js';
import { Tactic } from './models/Tactic.js';
import { Squad } from './models/Squad.js';
import { Alert } from './models/Alert.js';
import { Notification } from './models/Notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/efootyai';

async function migrate() {
    try {
        console.log('📦 Starting Migration to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const dbPath = path.join(__dirname, 'data', 'database.json');
        if (!fs.existsSync(dbPath)) {
            console.log('ℹ️ No local database.json found. Skipping data import.');
            process.exit(0);
        }

        const rawData = fs.readFileSync(dbPath, 'utf8');
        const data = JSON.parse(rawData);

        // Migrate Users
        if (data.users) {
            console.log(`👤 Migrating ${data.users.length} users...`);
            for (const u of data.users) {
                await User.findOneAndUpdate({ email: u.email }, u, { upsert: true });
            }
        }

        // Migrate Posts
        if (data.posts) {
            console.log(`📝 Migrating ${data.posts.length} posts...`);
            for (const p of data.posts) {
                await Post.findOneAndUpdate({ title: p.title }, p, { upsert: true });
            }
        }

        // Migrate Players
        if (data.players) {
            console.log(`⚽ Migrating ${data.players.length} players...`);
            for (const p of data.players) {
                await Player.findOneAndUpdate({ name: p.name }, p, { upsert: true });
            }
        }

        // Migrate Tactics
        if (data.tactics) {
            console.log(`📋 Migrating ${data.tactics.length} tactics...`);
            for (const t of data.tactics) {
                await Tactic.findOneAndUpdate({ title: t.title }, t, { upsert: true });
            }
        }

        // Migrate Squads
        if (data.squads) {
            console.log(`🛡️ Migrating ${data.squads.length} squads...`);
            for (const s of data.squads) {
                await Squad.findOneAndUpdate({ id: s.id }, s, { upsert: true });
            }
        }

        console.log('🚀 Migration Completed Successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration Failed:', err);
        process.exit(1);
    }
}

migrate();
