import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    position: { type: String, required: true },
    playStyle: { type: String },
    club: { type: String },
    nationality: { type: String },
    stats: {
        offensive: { type: Number, default: 0 },
        defensive: { type: Number, default: 0 },
        speed: { type: Number, default: 0 },
        physical: { type: Number, default: 0 },
        passing: { type: Number, default: 0 }
    },
    image: { type: String }
}, { timestamps: true });

export const Player = mongoose.model('Player', playerSchema);
