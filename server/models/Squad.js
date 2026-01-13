import mongoose from 'mongoose';

const squadMemberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    position: { type: String, required: true },
    rating: { type: Number }
});

const squadSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Keeping ID for frontend compatibility
    name: { type: String, required: true },
    manager: { type: String, default: 'TBA' },
    coachSkill: { type: String },
    players: [squadMemberSchema],
    screenshot: { type: String },
    lastAnalysis: { type: String }
}, { timestamps: true });

export const Squad = mongoose.model('Squad', squadSchema);
