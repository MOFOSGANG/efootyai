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

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error('❌ CRITICAL ERROR: MONGODB_URI environment variable is not defined!');
    console.log('Please add MONGODB_URI to your Render Environment settings.');
    // In production, we don't want to just exit(1) immediately without a message
    return;
  }

  try {
    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000 // Fast fail for logs
    });
    console.log('🚀 MongoDB Connected Successfully');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    if (process.env.NODE_ENV === 'production') {
      console.error('Check your MongoDB Atlas whitelist and connection string.');
    }
  }
}

export const db = {
  // Users
  getUsers: () => User.find().sort({ createdAt: -1 }),
  getUserById: (id) => User.findById(id),
  getUserByEmail: (email) => User.findOne({ email }),
  getUserByUsername: (username) => User.findOne({ username }),
  getLeaderboard: (limit = 10) => User.find({ isAdmin: false }).sort({ 'stats.likesReceived': -1 }).limit(limit),
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
  likePost: async (postId, userId) => {
    const post = await Post.findById(postId);
    if (!post || post.likedBy.includes(userId)) return post;

    // Update post
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $addToSet: { likedBy: userId }, $inc: { likes: 1 } },
      { new: true }
    );

    // Update author's stats
    const author = await User.findOne({ username: updatedPost.author });
    if (author) {
      await User.findByIdAndUpdate(author._id, { $inc: { 'stats.likesReceived': 1 } });
    }
    return updatedPost;
  },
  unlikePost: async (postId, userId) => {
    const post = await Post.findById(postId);
    if (!post || !post.likedBy.includes(userId)) return post;

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $pull: { likedBy: userId }, $inc: { likes: -1 } },
      { new: true }
    );

    const author = await User.findOne({ username: updatedPost.author });
    if (author) {
      await User.findByIdAndUpdate(author._id, { $inc: { 'stats.likesReceived': -1 } });
    }
    return updatedPost;
  },
  recordView: (postId) => Post.findByIdAndUpdate(postId, { $inc: { viewCount: 1 } }, { new: true }),

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
  getSquads: (owner) => Squad.find({ owner }),
  saveSquad: (squadData) => {
    return Squad.findOneAndUpdate(
      { id: squadData.id, owner: squadData.owner },
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

export default db;
