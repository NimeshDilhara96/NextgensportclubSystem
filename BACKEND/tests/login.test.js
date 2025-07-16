const request = require('supertest');
const app = require('../server'); // Adjust path as needed
const chai = require('chai');
const expect = chai.expect;
const mongoose = require('mongoose');
const User = require('../models/User');

const TEST_USER = {
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'testpassword',
    role: 'member',
    dob: new Date('2000-01-01'),
    age: 25,
    gender: 'Male',
    contact: '1234567890',
    membershipPackage: 'none',
    membershipStatus: 'active'
};

before(async () => {
    await mongoose.connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    await User.deleteOne({ email: TEST_USER.email });
    const user = new User(TEST_USER);
    await user.save();
});

after(async () => {
    await User.deleteOne({ email: TEST_USER.email });
    await mongoose.connection.close();
});

describe('POST /user/login', () => {
    it('should login successfully with valid credentials', async () => {
        const res = await request(app)
            .post('/user/login')
            .send({ email: 'testuser@example.com', password: 'testpassword' });

        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('token');
        expect(res.body).to.have.property('user');
    });

    it('should fail with invalid credentials', async () => {
        const res = await request(app)
            .post('/user/login')
            .send({ email: 'wrong@example.com', password: 'wrongpassword' });

        expect(res.statusCode).to.equal(401);
        expect(res.body).to.have.property('message');
    });

    it('should fail when missing email or password', async () => {
        const res = await request(app)
            .post('/user/login')
            .send({ email: '', password: '' });

        expect(res.statusCode).to.equal(400);
        expect(res.body).to.have.property('message');
    });
});
