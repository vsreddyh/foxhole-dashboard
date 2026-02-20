const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function signToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials.' });

        const token = signToken(user._id);
        res.json({ token, user: user.toSafeObject() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// POST /api/auth/logout — stateless JWT; client just drops the token
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out.' });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: 'User not found.' });
        res.json(user.toSafeObject());
    } catch (err) {
        res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
