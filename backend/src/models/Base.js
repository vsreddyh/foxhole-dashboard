const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
    text: { type: String, required: true },
    done: { type: Boolean, default: false },
});

const baseSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        region: { type: String, required: true, trim: true },       // display name e.g. "The Fingers"
        regionKey: { type: String, trim: true },                    // raw API name e.g. "TheFingersHex"
        subRegion: { type: String, required: true, trim: true },
        landmark: { type: String, default: '', trim: true },
        notes: { type: String, default: '' },
        checklist: [checklistItemSchema],
        // Cached alerts from Foxhole API polling
        alerts: [{ type: String }],
        alertsUpdatedAt: { type: Date, default: null },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
);

const Base = mongoose.model('Base', baseSchema);
module.exports = Base;
