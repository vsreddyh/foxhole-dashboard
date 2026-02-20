/**
 * Seed script — creates the initial Maintainer account.
 * Run: node scripts/seed.js
 *
 * Set MAINTAINER_USERNAME and MAINTAINER_PASSWORD env vars,
 * or edit the defaults below before first run.
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('../src/models/User');

const USERNAME = process.env.MAINTAINER_USERNAME || 'maintainer';
const PASSWORD = process.env.MAINTAINER_PASSWORD || 'changeme123';

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ username: USERNAME });
    if (existing) {
        console.log(`User "${USERNAME}" already exists (role: ${existing.role}). Nothing to do.`);
        await mongoose.disconnect();
        return;
    }

    const passwordHash = await bcrypt.hash(PASSWORD, 12);
    const user = await User.create({ username: USERNAME, passwordHash, role: 'Maintainer' });

    console.log(`✅ Maintainer account created:`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Password: ${PASSWORD}`);
    console.log(`   ⚠️  Change this password immediately after first login!`);

    await mongoose.disconnect();
}

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
