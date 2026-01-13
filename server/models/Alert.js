import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
    id: { type: String, default: 'a1' },
    type: { type: String, enum: ['info', 'critical'], default: 'info' },
    message: { type: String, default: '' },
    active: { type: Boolean, default: false }
}, { timestamps: true });

export const Alert = mongoose.model('Alert', alertSchema);
