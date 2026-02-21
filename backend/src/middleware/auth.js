const jwt = require('jsonwebtoken');
const { User, ROLES } = require('../models/User');

/**
 * Attach req.user if a valid JWT or a valid Session is present.
 */
async function authenticate(req, res, next) {
    try {
        // 1. Try Session Authentication First
        if (req.session && req.session.userId) {
            const user = await User.findById(req.session.userId).lean();
            if (user) {
                req.user = user;
                return next();
            }
        }

        // 2. Fallback to JWT Authentication (Backward Compatibility / Mobile)
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.slice(7)
            : req.cookies?.token;

        if (!token) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).lean();
        if (!user) return res.status(401).json({ error: 'User not found.' });

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
}

/**
 * Require the authenticated user to have at least `minRole`.
 * Role hierarchy (ascending): Member < Trusted < Admin < Super Admin < Maintainer
 */
function requireRole(minRole) {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: 'Not authenticated.' });
        const userIndex = ROLES.indexOf(req.user.role);
        const requiredIndex = ROLES.indexOf(minRole);
        if (userIndex < requiredIndex) {
            return res.status(403).json({ error: 'Insufficient permissions.' });
        }
        next();
    };
}

module.exports = { authenticate, requireRole };
