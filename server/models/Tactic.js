import mongoose from 'mongoose';

const tacticSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    formation: { type: String, required: true },
    description: { type: String },
    difficulty: { type: String, enum: ['Beginner', 'Advanced', 'Pro'], default: 'Beginner' },
    category: { type: String, default: 'Meta' },
    likes: { type: Number, default: 0 },
    tags: [String],
    settings: {
        defensiveLine: { type: Number, default: 50 },
        pressing: { type: Number, default: 50 },
        buildUp: { type: String, default: 'Balanced' }
    }
}, { timestamps: true });

export const Tactic = mongoose.model('Tactic', tacticSchema);
