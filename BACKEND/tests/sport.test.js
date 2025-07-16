const request = require('supertest');
const mongoose = require('mongoose');
const chai = require('chai');
const Sport = require('../models/Sport');
const app = require('../server');

const expect = chai.expect;

const TEST_SPORT = {
    name: 'Test Sport',
    description: 'A test sport for unit testing',
    category: 'Test Category',
    schedule: 'Mon-Fri 10:00-12:00',
    maxCapacity: 10,
    availability: 'Available'
};

before(async () => {
    await mongoose.connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
});

describe('Sport API', () => {
    beforeEach(async () => {
        await Sport.deleteOne({ name: TEST_SPORT.name });
    });

    afterEach(async () => {
        await Sport.deleteOne({ name: TEST_SPORT.name });
    });

    describe('POST /sports/create', () => {
        it('should create a new sport', async () => {
            const res = await request(app)
                .post('/sports/create')
                .field('name', TEST_SPORT.name)
                .field('description', TEST_SPORT.description)
                .field('category', TEST_SPORT.category)
                .field('schedule', TEST_SPORT.schedule)
                .field('maxCapacity', TEST_SPORT.maxCapacity)
                .field('availability', TEST_SPORT.availability);

            expect(res.statusCode).to.equal(201);
            expect(res.body).to.have.property('sport');
            expect(res.body.sport.name).to.equal(TEST_SPORT.name);
        });

        it('should not create sport with existing name', async () => {
            await new Sport(TEST_SPORT).save();

            const res = await request(app)
                .post('/sports/create')
                .field('name', TEST_SPORT.name)
                .field('description', TEST_SPORT.description)
                .field('category', TEST_SPORT.category)
                .field('schedule', TEST_SPORT.schedule)
                .field('maxCapacity', TEST_SPORT.maxCapacity)
                .field('availability', TEST_SPORT.availability);

            expect(res.statusCode).to.equal(500); // Duplicate key error returns 500 in your route
            expect(res.body).to.have.property('status', 'error');
        });
    });

    describe('GET /sports', () => {
        beforeEach(async () => {
            await Sport.deleteOne({ name: TEST_SPORT.name });
            await new Sport(TEST_SPORT).save();
        });

        it('should get all sports', async () => {
            const res = await request(app)
                .get('/sports');

            expect(res.statusCode).to.equal(200);
            expect(res.body).to.have.property('sports');
            expect(res.body.sports).to.be.an('array');
            expect(res.body.sports.some(s => s.name === TEST_SPORT.name)).to.be.true;
        });
    });

    describe('GET /sports/:sportId', () => {
        let sportId;
        beforeEach(async () => {
            await Sport.deleteOne({ name: TEST_SPORT.name });
            const sport = await new Sport(TEST_SPORT).save();
            sportId = sport._id;
        });

        it('should get sport by id', async () => {
            const res = await request(app)
                .get(`/sports/${sportId}`);

            expect(res.statusCode).to.equal(200);
            expect(res.body).to.have.property('sport');
            expect(res.body.sport.name).to.equal(TEST_SPORT.name);
        });

        it('should return 500 for invalid id', async () => {
            const res = await request(app)
                .get('/sports/invalidid');

            expect(res.statusCode).to.equal(500); // CastError returns 500 in your route
            expect(res.body).to.have.property('status', 'error');
        });
    });

    describe('DELETE /sports/:sportId', () => {
        let sportId;
        beforeEach(async () => {
            await Sport.deleteOne({ name: TEST_SPORT.name });
            const sport = await new Sport(TEST_SPORT).save();
            sportId = sport._id;
        });

        it('should delete sport by id', async () => {
            const res = await request(app)
                .delete(`/sports/${sportId}`);

            expect(res.statusCode).to.equal(200);
            expect(res.body).to.have.property('status', 'success');
        });

        it('should return 404 for non-existent sport', async () => {
            const res = await request(app)
                .delete('/sports/000000000000000000000000');

            expect(res.statusCode).to.equal(404);
            expect(res.body).to.have.property('status', 'error');
        });
    });
});

// Do not close mongoose connection here if you have other test files