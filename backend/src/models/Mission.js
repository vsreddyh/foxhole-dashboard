const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
    text: { type: String, required: true },
    done: { type: Boolean, default: false },
});

const missionSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        status: {
            type: String,
            enum: ['Planning', 'Active', 'Complete'],
            default: 'Planning',
        },
        checklist: [checklistItemSchema],
        assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
);

const Mission = mongoose.model('Mission', missionSchema);
module.exports = Mission;
