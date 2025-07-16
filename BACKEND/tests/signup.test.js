const request = require('supertest');
const app = require('../server');
const chai = require('chai');
const expect = chai.expect;
const mongoose = require('mongoose');
const User = require('../models/User');

const FULL_TEST_USER = {
    name: 'Signup Test',
    email: 'signuptest@example.com',
    password: 'signup123',
    dob: new Date('1995-05-05'),
    age: 30,
    gender: 'Male',
    contact: '9876543210',
    role: 'member',
    membershipPackage: 'none',
    membershipStatus: 'active'
};

beforeEach(async () => {
    await User.deleteOne({ email: FULL_TEST_USER.email });
});

afterEach(async () => {
    await User.deleteOne({ email: FULL_TEST_USER.email });
});

describe('POST /user/add (Signup)', () => {
    it('should signup successfully with valid data', async () => {
        const res = await request(app)
            .post('/user/add')
            .send(FULL_TEST_USER);
        expect(res.statusCode).to.equal(200);
        expect(res.body).to.include('Register Success');
    });

    it('should fail with missing required fields', async () => {
        const originalWarn = console.warn;
        const originalLog = console.log;
        console.warn = () => {};
        console.log = () => {};
        const res = await request(app)
            .post('/user/add')
            .send({ email: '', password: '', name: '' });
        expect(res.statusCode).to.be.oneOf([400, 500]);
        console.warn = originalWarn;
        console.log = originalLog;
    });

    it('should fail with duplicate email', async () => {
        await request(app).post('/user/add').send(FULL_TEST_USER);
        const originalWarn = console.warn;
        const originalLog = console.log;
        console.warn = () => {};
        console.log = () => {};
        const res = await request(app)
            .post('/user/add')
            .send(FULL_TEST_USER);
        expect(res.statusCode).to.be.oneOf([400, 500]);
        console.warn = originalWarn;
        console.log = originalLog;
    });
});

describe('POST /auth/signup (Signup)', () => {
    it('should signup successfully with valid data', async () => {
        const res = await request(app)
            .post('/auth/signup')
            .send(FULL_TEST_USER);
        expect(res.statusCode).to.equal(201);
        expect(res.body).to.have.property('message').that.includes('User registered successfully');
    });

    it('should fail with missing required fields', async () => {
        const res = await request(app)
            .post('/auth/signup')
            .send({ email: '', password: '', name: '' });
        expect(res.statusCode).to.be.oneOf([400, 500]);
    });

    it('should fail with duplicate email', async () => {
        await request(app).post('/auth/signup').send(FULL_TEST_USER);
        const res = await request(app)
            .post('/auth/signup')
            .send(FULL_TEST_USER);
        expect(res.statusCode).to.be.oneOf([400, 500]);
    });
});
