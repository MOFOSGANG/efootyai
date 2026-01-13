import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    type: { type: String, enum: ['system', 'user', 'alert'], default: 'system' },
    message: { type: String, required: true },
    details: { type: String },
    timestamp: { type: String, default: () => new Date().toLocaleTimeString() }
}, { timestamps: true });

export const Notification = mongoose.model('Notification', notificationSchema);
