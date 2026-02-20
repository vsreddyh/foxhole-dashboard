const express = require('express');
const Base = require('../models/Base');
const { authenticate, requireRole } = require('../middleware/auth');
const { getMapEvents } = require('../services/foxholeApi');

const router = express.Router();
router.use(authenticate);

// GET /api/bases
router.get('/', async (req, res) => {
    try {
        const bases = await Base.find().populate('createdBy', 'username role').sort({ createdAt: -1 });
        res.json(bases);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/bases/:id
router.get('/:id', async (req, res) => {
    try {
        const base = await Base.findById(req.params.id).populate('createdBy', 'username role');
        if (!base) return res.status(404).json({ error: 'Base not found.' });
        res.json(base);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// POST /api/bases — Trusted+
router.post('/', requireRole('Trusted'), async (req, res) => {
    try {
        const { name, region, regionKey, subRegion, landmark, notes, checklist } = req.body;
        if (!name || !region || !subRegion) {
            return res.status(400).json({ error: 'name, region, and subRegion are required.' });
        }
        const base = await Base.create({
            name, region, regionKey: regionKey || '', subRegion, landmark,
            notes: notes || '',
            checklist: checklist || [],
            createdBy: req.user._id,
        });

        // Auto-fetch threat info from Foxhole API on creation
        try {
            const hexName = base.regionKey || base.region;
            const threat = await getMapEvents(hexName);
            base.alerts = threat.alerts;
            base.alertsUpdatedAt = new Date();
            await base.save();
        } catch {
            // Non-fatal — base still created, just no alert data yet
        }

        res.status(201).json(base);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// PATCH /api/bases/:id — Trusted+
router.patch('/:id', requireRole('Trusted'), async (req, res) => {
    try {
        const allowed = ['name', 'region', 'regionKey', 'subRegion', 'landmark', 'notes', 'checklist'];
        const updates = {};
        allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

        const base = await Base.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        if (!base) return res.status(404).json({ error: 'Base not found.' });
        res.json(base);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// DELETE /api/bases/:id — Admin+
router.delete('/:id', requireRole('Admin'), async (req, res) => {
    try {
        const base = await Base.findByIdAndDelete(req.params.id);
        if (!base) return res.status(404).json({ error: 'Base not found.' });
        res.json({ message: 'Base deleted.' });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/bases/:id/alerts — fetch / refresh Foxhole API threat data
router.get('/:id/alerts', async (req, res) => {
    try {
        const base = await Base.findById(req.params.id);
        if (!base) return res.status(404).json({ error: 'Base not found.' });

        // Use regionKey (raw hex name) if available, fall back to region display name
        const hexName = base.regionKey || base.region;
        const result = await getMapEvents(hexName);

        // Cache on base document
        base.alerts = result.alerts;
        base.alertsUpdatedAt = new Date();
        await base.save();

        res.json({ ...result, updatedAt: base.alertsUpdatedAt });
    } catch (err) {
        console.error('Foxhole API error:', err.message);
        res.status(502).json({ error: 'Failed to fetch Foxhole API data.' });
    }
});

module.exports = router;
