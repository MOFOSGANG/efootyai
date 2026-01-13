import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.js';
import { Post } from './models/Post.js';
import { Player } from './models/Player.js';
import { Tactic } from './models/Tactic.js';
import { Squad } from './models/Squad.js';
import { Alert } from './models/Alert.js';
import { Notification } from './models/Notification.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/efootyai';

export async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🚀 MongoDB Connected Successfully');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
}

export const db = {
  // Users
  getUsers: () => User.find().sort({ createdAt: -1 }),
  getUserById: (id) => User.findById(id),
  getUserByEmail: (email) => User.findOne({ email }),
  getUserByUsername: (username) => User.findOne({ username }),
  saveUser: (userData) => {
    return User.findOneAndUpdate(
      { email: userData.email },
      userData,
      { upsert: true, new: true }
    );
  },
  updateUser: (id, updates) => User.findByIdAndUpdate(id, updates, { new: true }),

  // Posts
  getPosts: () => Post.find().sort({ createdAt: -1 }),
  getPostById: (id) => Post.findById(id),
  savePost: (postData) => {
    const post = new Post(postData);
    return post.save();
  },
  updatePost: (id, status) => Post.findByIdAndUpdate(id, { status }, { new: true }),
  deletePost: (id) => Post.findByIdAndDelete(id),

  // Players
  getPlayers: () => Player.find().sort({ rating: -1 }),
  savePlayers: async (players) => {
    // For bulk sync, we might want to clear or update
    for (const p of players) {
      await Player.findOneAndUpdate({ name: p.name }, p, { upsert: true });
    }
    return { count: players.length };
  },
  updatePlayer: (id, updates) => Player.findByIdAndUpdate(id, updates, { new: true }),

  // Tactics
  getTactics: () => Tactic.find().sort({ createdAt: -1 }),
  saveTactic: (tacticData) => {
    const tactic = new Tactic(tacticData);
    return tactic.save();
  },
  saveTactics: async (tactics) => {
    for (const t of tactics) {
      await Tactic.findOneAndUpdate({ title: t.title }, t, { upsert: true });
    }
    return { count: tactics.length };
  },

  // Squads
  getSquads: () => Squad.find(),
  saveSquad: (squadData) => {
    return Squad.findOneAndUpdate(
      { id: squadData.id },
      squadData,
      { upsert: true, new: true }
    );
  },

  // Alerts
  getAlert: () => Alert.findOne({ id: 'a1' }),
  saveAlert: (alertData) => {
    return Alert.findOneAndUpdate(
      { id: 'a1' },
      alertData,
      { upsert: true, new: true }
    );
  },

  // Notifications
  getNotifications: () => Notification.find().sort({ createdAt: -1 }).limit(50),
  saveNotification: (notifData) => {
    const notif = new Notification(notifData);
    return notif.save();
  }
};
