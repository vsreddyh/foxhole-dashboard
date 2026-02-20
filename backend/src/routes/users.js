const express = require('express');
const bcrypt = require('bcryptjs');
const { User, ROLES } = require('../models/User');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// All user management routes require authentication
router.use(authenticate);

/**
 * POST /api/users
 * Create a new user account. Only Admin+ can do this.
 * The created user's role cannot exceed the creator's role.
 */
router.post('/', requireRole('Admin'), async (req, res) => {
    try {
        const { username, password, role = 'Member' } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        const creatorIndex = ROLES.indexOf(req.user.role);
        const newRoleIndex = ROLES.indexOf(role);
        if (newRoleIndex < 0) {
            return res.status(400).json({ error: `Invalid role. Valid roles: ${ROLES.join(', ')}` });
        }
        // Nobody can create a Maintainer through the API (seed script only)
        if (role === 'Maintainer') {
            return res.status(403).json({ error: 'Maintainer accounts can only be created via the seed script.' });
        }
        // Cannot create a user with a role equal to or higher than your own
        if (req.user.role !== 'Maintainer' && newRoleIndex >= creatorIndex) {
            return res.status(403).json({ error: 'Cannot create a user with a role equal to or higher than your own.' });
        }

        const existing = await User.findOne({ username });
        if (existing) return res.status(409).json({ error: 'Username already taken.' });

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({ username, passwordHash, role });
        res.status(201).json(user.toSafeObject());
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * GET /api/users
 * List all users. Admin+ only.
 */
router.get('/', requireRole('Admin'), async (req, res) => {
    try {
        const users = await User.find().lean().select('-passwordHash').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * PATCH /api/users/:id/role
 * Promote or demote a user. Super Admin+ only.
 * Cannot modify users of equal or higher role.
 */
router.patch('/:id/role', requireRole('Super Admin'), async (req, res) => {
    try {
        const { role } = req.body;
        const roleIndex = ROLES.indexOf(role);
        if (roleIndex < 0) {
            return res.status(400).json({ error: `Invalid role. Valid roles: ${ROLES.join(', ')}` });
        }

        const target = await User.findById(req.params.id);
        if (!target) return res.status(404).json({ error: 'User not found.' });

        const actorIndex = ROLES.indexOf(req.user.role);
        const targetCurrentIndex = ROLES.indexOf(target.role);

        // Nobody can assign the Maintainer role via the API
        if (role === 'Maintainer') {
            return res.status(403).json({ error: 'Cannot assign the Maintainer role.' });
        }

        if (req.user.role !== 'Maintainer') {
            // Cannot touch users at or above your level
            if (targetCurrentIndex >= actorIndex) {
                return res.status(403).json({ error: 'Cannot modify a user with equal or higher role.' });
            }
            // Cannot assign a role equal to or above your own
            if (roleIndex >= actorIndex) {
                return res.status(403).json({ error: 'Cannot assign a role equal to or higher than your own.' });
            }
        }

        target.role = role;
        await target.save();
        res.json(target.toSafeObject());
    } catch (err) {
        res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * DELETE /api/users/:id
 * Remove a user. Admin+ only, with hierarchy check.
 */
router.delete('/:id', requireRole('Admin'), async (req, res) => {
    try {
        const target = await User.findById(req.params.id);
        if (!target) return res.status(404).json({ error: 'User not found.' });

        const actorIndex = ROLES.indexOf(req.user.role);
        const targetIndex = ROLES.indexOf(target.role);

        if (req.user.role !== 'Maintainer' && targetIndex >= actorIndex) {
            return res.status(403).json({ error: 'Cannot remove a user with equal or higher role.' });
        }
        if (target._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ error: 'Cannot delete yourself.' });
        }

        await target.deleteOne();
        res.json({ message: 'User deleted.' });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
