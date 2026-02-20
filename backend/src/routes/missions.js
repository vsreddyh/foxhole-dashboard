const express = require('express');
const Mission = require('../models/Mission');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/missions
router.get('/', async (req, res) => {
    try {
        const missions = await Mission.find()
            .populate('createdBy', 'username role')
            .populate('assignedTo', 'username role')
            .sort({ createdAt: -1 });
        res.json(missions);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/missions/:id
router.get('/:id', async (req, res) => {
    try {
        const mission = await Mission.findById(req.params.id)
            .populate('createdBy', 'username role')
            .populate('assignedTo', 'username role');
        if (!mission) return res.status(404).json({ error: 'Mission not found.' });
        res.json(mission);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// POST /api/missions — Trusted+
router.post('/', requireRole('Trusted'), async (req, res) => {
    try {
        const { title, description, status, checklist, assignedTo } = req.body;
        if (!title) return res.status(400).json({ error: 'Title is required.' });

        const mission = await Mission.create({
            title,
            description: description || '',
            status: status || 'Planning',
            checklist: checklist || [],
            assignedTo: assignedTo || [],
            createdBy: req.user._id,
        });
        res.status(201).json(mission);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// PATCH /api/missions/:id — Trusted+
router.patch('/:id', requireRole('Trusted'), async (req, res) => {
    try {
        const allowed = ['title', 'description', 'status', 'checklist', 'assignedTo'];
        const updates = {};
        allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

        const mission = await Mission.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        if (!mission) return res.status(404).json({ error: 'Mission not found.' });
        res.json(mission);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// DELETE /api/missions/:id — Admin+
router.delete('/:id', requireRole('Admin'), async (req, res) => {
    try {
        const mission = await Mission.findByIdAndDelete(req.params.id);
        if (!mission) return res.status(404).json({ error: 'Mission not found.' });
        res.json({ message: 'Mission deleted.' });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
