const request = require('supertest');
const mongoose = require('mongoose');
const chai = require('chai');
const Admin = require('../models/admin');
const app = require('../server');

const expect = chai.expect;

const TEST_ADMIN = {
    username: 'testadmin',
    password: 'testpassword',
    email: 'testadmin@example.com' // Add this line
};

before(async () => {
    await mongoose.connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
});

describe('Admin API', () => {
    // Only remove the specific test admin before and after each test
    beforeEach(async () => {
        await Admin.deleteOne({ username: TEST_ADMIN.username });
    });

    afterEach(async () => {
        await Admin.deleteOne({ username: TEST_ADMIN.username });
    });

    describe('POST /api/admins/register', () => {
        it('should register a new admin', async () => {
            const res = await request(app)
                .post('/api/admins/register')
                .send(TEST_ADMIN);

            expect(res.statusCode).to.equal(201);
            expect(res.body).to.have.property('_id');
            expect(res.body.username).to.equal(TEST_ADMIN.username);
        });

        it('should not register admin with existing username', async () => {
            await new Admin(TEST_ADMIN).save();

            const res = await request(app)
                .post('/api/admins/register')
                .send(TEST_ADMIN);

            expect(res.statusCode).to.equal(400);
            expect(res.body).to.have.property('message');
        });
    });

    describe('POST /api/admins/login', () => {
        beforeEach(async () => {
            await Admin.deleteOne({ username: TEST_ADMIN.username });
            await new Admin(TEST_ADMIN).save();
        });

        it('should login with valid credentials', async () => {
            const res = await request(app)
                .post('/api/admins/login')
                .send(TEST_ADMIN);

            expect(res.statusCode).to.equal(200);
            expect(res.body).to.have.property('admin');
            expect(res.body.admin.username).to.equal(TEST_ADMIN.username);
        });

        it('should fail login with invalid credentials', async () => {
            const res = await request(app)
                .post('/api/admins/login')
                .send({ username: 'wrong', password: 'wrong' });

            expect(res.statusCode).to.equal(400);
            expect(res.body).to.have.property('message');
        });
    });

    describe('GET /api/admins/profile', () => {
        let adminId;
        beforeEach(async () => {
            await Admin.deleteOne({ username: TEST_ADMIN.username });
            const admin = await new Admin(TEST_ADMIN).save();
            adminId = admin._id;
        });

        it('should get admin profile by id', async () => {
            const res = await request(app)
                .get('/api/admins/profile')
                .query({ id: adminId.toString() });

            expect(res.statusCode).to.equal(200);
            expect(res.body).to.have.property('username', TEST_ADMIN.username);
            expect(res.body).to.not.have.property('password');
        });

        it('should return 500 for invalid id', async () => {
            const res = await request(app)
                .get('/api/admins/profile')
                .query({ id: 'invalidid' });

            expect(res.statusCode).to.equal(500);
            expect(res.body).to.have.property('message');
        });
    });
});

// Do not close mongoose connection here if you have other test