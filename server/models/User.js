import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    efootballName: { type: String },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    bio: { type: String, default: 'eFooTyAi Strategist' },
    rank: { type: String, default: 'Division Beginner' },
    stats: {
        likesReceived: { type: Number, default: 0 },
        postsApproved: { type: Number, default: 0 },
        tacticsShared: { type: Number, default: 0 }
    },
    joinedDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
