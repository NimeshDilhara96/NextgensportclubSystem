const request = require('supertest');
const mongoose = require('mongoose');
const chai = require('chai');
const Facility = require('../models/Facility');
const app = require('../server');

const expect = chai.expect;

const TEST_FACILITY = {
    name: 'Test Facility',
    description: 'A facility for testing',
    hours: '08:00 AM-08:00 PM',
    capacity: 5,
    availability: 'Available',
    location: 'Test Building'
};

before(async () => {
    await mongoose.connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
});

describe('Facility API', () => {
    beforeEach(async () => {
        await Facility.deleteOne({ name: TEST_FACILITY.name });
    });

    afterEach(async () => {
        await Facility.deleteOne({ name: TEST_FACILITY.name });
    });

    describe('POST /facilities', () => {
        it('should create a new facility', async () => {
            const res = await request(app)
                .post('/facilities')
                .field('name', TEST_FACILITY.name)
                .field('description', TEST_FACILITY.description)
                .field('hours', TEST_FACILITY.hours)
                .field('capacity', TEST_FACILITY.capacity)
                .field('availability', TEST_FACILITY.availability)
                .field('location', TEST_FACILITY.location);

            expect(res.statusCode).to.equal(201);
            expect(res.body).to.have.property('facility');
            expect(res.body.facility.name).to.equal(TEST_FACILITY.name);
        });

        it('should not create facility with missing required fields', async () => {
            const res = await request(app)
                .post('/facilities')
                .field('name', ''); // Missing required fields

            expect(res.statusCode).to.equal(500);
            expect(res.body).to.have.property('status', 'error');
        });
    });

    describe('GET /facilities', () => {
        beforeEach(async () => {
            await Facility.deleteOne({ name: TEST_FACILITY.name });
            await new Facility(TEST_FACILITY).save();
        });

        it('should get all facilities', async () => {
            const res = await request(app)
                .get('/facilities');

            expect(res.statusCode).to.equal(200);
            expect(res.body).to.have.property('facilities');
            expect(res.body.facilities).to.be.an('array');
            expect(res.body.facilities.some(f => f.name === TEST_FACILITY.name)).to.be.true;
        });
    });

    describe('GET /facilities/:id', () => {
        let facilityId;
        beforeEach(async () => {
            await Facility.deleteOne({ name: TEST_FACILITY.name });
            const facility = await new Facility(TEST_FACILITY).save();
            facilityId = facility._id;
        });

        it('should get facility by id', async () => {
            const res = await request(app)
                .get(`/facilities/${facilityId}`);

            expect(res.statusCode).to.equal(200);
            expect(res.body).to.have.property('facility');
            expect(res.body.facility.name).to.equal(TEST_FACILITY.name);
        });

        it('should return 404 for non-existent facility', async () => {
            const res = await request(app)
                .get('/facilities/000000000000000000000000');

            expect(res.statusCode).to.equal(404);
            expect(res.body).to.have.property('status', 'error');
        });
    });

    describe('PUT /facilities/:id', () => {
        let facilityId;
        beforeEach(async () => {
            await Facility.deleteOne({ name: TEST_FACILITY.name });
            const facility = await new Facility(TEST_FACILITY).save();
            facilityId = facility._id;
        });

        it('should update facility by id', async () => {
            const res = await request(app)
                .put(`/facilities/${facilityId}`)
                .field('name', 'Updated Facility');

            expect(res.statusCode).to.equal(200);
            expect(res.body).to.have.property('facility');
            expect(res.body.facility.name).to.equal('Updated Facility');
        });

        it('should return 404 for non-existent facility', async () => {
            const res = await request(app)
                .put('/facilities/000000000000000000000000')
                .field('name', 'Should Not Exist');

            expect(res.statusCode).to.equal(404);
            expect(res.body).to.have.property('status', 'error');
        });
    });

    describe('DELETE /facilities/:id', () => {
        let facilityId;
        beforeEach(async () => {
            await Facility.deleteOne({ name: TEST_FACILITY.name });
            const facility = await new Facility(TEST_FACILITY).save();
            facilityId = facility._id;
        });

        it('should delete facility by id', async () => {
            const res = await request(app)
                .delete(`/facilities/${facilityId}`);

            expect(res.statusCode).to.equal(200);
            expect(res.body).to.have.property('status', 'success');
        });

        it('should return 404 for non-existent facility', async () => {
            const res = await request(app)
                .delete('/facilities/000000000000000000000000');

            expect(res.statusCode).to.equal(404);
            expect(res.body).to.have.property('status', 'error');
        });
    });
});

// Do not close mongoose connection here if you have other test