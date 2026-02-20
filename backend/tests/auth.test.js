/**
 * Backend tests using Jest + Supertest.
 * Uses an in-memory MongoDB instance (mongodb-memory-server) to avoid
 * needing a real DB. Install: npm i -D mongodb-memory-server
 *
 * Run: npm test
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');
const app = require('../src/index');
const { User } = require('../src/models/User');

let mongoServer;

// Bootstrap in-memory DB before all tests
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    // Clean DB between tests
    await User.deleteMany({});
});

// ─── Helpers ────────────────────────────────────────────────────────────────

async function createUser(username, password, role = 'Member') {
    const passwordHash = await bcrypt.hash(password, 4); // fast salt for tests
    return User.create({ username, passwordHash, role });
}

async function loginAs(agent, username, password) {
    const res = await agent
        .post('/api/auth/login')
        .send({ username, password });
    return res.body.token;
}

// ─── Auth Routes ─────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
    it('returns 200 + token on valid credentials', async () => {
        await createUser('tester', 'pass123', 'Member');
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'tester', password: 'pass123' });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
        expect(res.body.user.username).toBe('tester');
        expect(res.body.user.role).toBe('Member');
    });

    it('returns 401 on wrong password', async () => {
        await createUser('tester', 'pass123', 'Member');
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'tester', password: 'wrong' });
        expect(res.status).toBe(401);
    });

    it('returns 401 on unknown user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'nobody', password: 'pass' });
        expect(res.status).toBe(401);
    });
});

describe('GET /api/auth/me', () => {
    it('returns current user when authenticated', async () => {
        await createUser('alpha', 'pw', 'Admin');
        const agent = request.agent(app);
        const token = await loginAs(agent, 'alpha', 'pw');
        const res = await agent
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.username).toBe('alpha');
    });

    it('returns 401 without token', async () => {
        const res = await request(app).get('/api/auth/me');
        expect(res.status).toBe(401);
    });
});

// ─── User Management ──────────────────────────────────────────────────────────

describe('POST /api/users (create user)', () => {
    it('Admin can create a Member', async () => {
        await createUser('admin1', 'pw', 'Admin');
        const agent = request.agent(app);
        const token = await loginAs(agent, 'admin1', 'pw');
        const res = await agent
            .post('/api/users')
            .set('Authorization', `Bearer ${token}`)
            .send({ username: 'newmember', password: 'pw', role: 'Member' });
        expect(res.status).toBe(201);
        expect(res.body.username).toBe('newmember');
    });

    it('Admin cannot create another Admin', async () => {
        await createUser('admin1', 'pw', 'Admin');
        const agent = request.agent(app);
        const token = await loginAs(agent, 'admin1', 'pw');
        const res = await agent
            .post('/api/users')
            .set('Authorization', `Bearer ${token}`)
            .send({ username: 'admin2', password: 'pw', role: 'Admin' });
        expect(res.status).toBe(403);
    });

    it('Member cannot create users', async () => {
        await createUser('member1', 'pw', 'Member');
        const agent = request.agent(app);
        const token = await loginAs(agent, 'member1', 'pw');
        const res = await agent
            .post('/api/users')
            .set('Authorization', `Bearer ${token}`)
            .send({ username: 'other', password: 'pw', role: 'Member' });
        expect(res.status).toBe(403);
    });

    it('Maintainer can create Super Admin', async () => {
        await createUser('maintainer', 'pw', 'Maintainer');
        const agent = request.agent(app);
        const token = await loginAs(agent, 'maintainer', 'pw');
        const res = await agent
            .post('/api/users')
            .set('Authorization', `Bearer ${token}`)
            .send({ username: 'sa1', password: 'pw', role: 'Super Admin' });
        expect(res.status).toBe(201);
        expect(res.body.role).toBe('Super Admin');
    });
});

describe('PATCH /api/users/:id/role', () => {
    it('Super Admin can demote Admin to Member', async () => {
        await createUser('sa', 'pw', 'Super Admin');
        const target = await createUser('adm', 'pw', 'Admin');
        const agent = request.agent(app);
        const token = await loginAs(agent, 'sa', 'pw');
        const res = await agent
            .patch(`/api/users/${target._id}/role`)
            .set('Authorization', `Bearer ${token}`)
            .send({ role: 'Member' });
        expect(res.status).toBe(200);
        expect(res.body.role).toBe('Member');
    });

    it('Admin cannot change roles', async () => {
        await createUser('adm', 'pw', 'Admin');
        const target = await createUser('member', 'pw', 'Member');
        const agent = request.agent(app);
        const token = await loginAs(agent, 'adm', 'pw');
        const res = await agent
            .patch(`/api/users/${target._id}/role`)
            .set('Authorization', `Bearer ${token}`)
            .send({ role: 'Trusted' });
        expect(res.status).toBe(403);
    });
});
