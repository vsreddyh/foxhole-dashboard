require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const baseRoutes = require('./routes/bases');
const missionRoutes = require('./routes/missions');

const app = express();

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGIN
    ? process.env.ALLOWED_ORIGIN.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        // or if the origin is in our allowed list
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
const session = require('express-session');
const { MongoStore } = require('connect-mongo');

app.use(express.json());

// Session Configuration
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'foxhole_super_secret_fallback',
        resave: false,
        saveUninitialized: false,
        store: process.env.NODE_ENV === 'test'
            ? undefined
            : MongoStore.create({
                mongoUrl: process.env.MONGO_URI,
                collectionName: 'sessions',
                ttl: 7 * 24 * 60 * 60 // 7 days (aligning with JWT expiration)
            }),
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // Required for cross-site cookies if frontend/backend domains differ
        }
    })
);

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bases', baseRoutes);
app.use('/api/missions', missionRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
    mongoose
        .connect(process.env.MONGO_URI)
        .then(() => {
            console.log('✅ Connected to MongoDB');
            app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
        })
        .catch((err) => {
            console.error('❌ MongoDB connection error:', err);
            process.exit(1);
        });
}

module.exports = app; // for tests
