const request = require('supertest');
const mongoose = require('mongoose');
const chai = require('chai');
const Facility = require('../models/Facility');
const app = require('../server');

const expect = chai.expect;

const TEST_FACILITY = {
    name: 'Booking Test Facility',
    description: 'Facility for booking tests',
    hours: '09:00 AM-09:00 PM',
    capacity: 10,
    availability: 'Available',
    location: 'Booking Building'
};

const TEST_BOOKING = {
    userEmail: 'testuser@example.com',
    date: '2025-07-21',
    time: '10:00 AM'
};

let facilityId;

before(async () => {
    await mongoose.connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
});

describe('Facility Booking API', () => {
    beforeEach(async () => {
        await Facility.deleteOne({ name: TEST_FACILITY.name });
        const facility = await new Facility(TEST_FACILITY).save();
        facilityId = facility._id;
    });

    afterEach(async () => {
        await Facility.deleteOne({ name: TEST_FACILITY.name });
    });

    describe('POST /facilities/book/:id', () => {
        it('should create a booking for a facility', async () => {
            const res = await request(app)
                .post(`/facilities/book/${facilityId}`)
                .send(TEST_BOOKING);

            expect(res.statusCode).to.equal(201);
            expect(res.body).to.have.property('status', 'success');
            expect(res.body).to.have.property('booking');
            expect(res.body.booking).to.have.property('userEmail', TEST_BOOKING.userEmail);
        });

        it('should return 404 for non-existent facility', async () => {
            const res = await request(app)
                .post('/facilities/book/000000000000000000000000')
                .send(TEST_BOOKING);

            expect(res.statusCode).to.equal(404);
            expect(res.body).to.have.property('status', 'error');
        });
    });

    describe('GET /facilities/:id/bookings', () => {
        beforeEach(async () => {
            // Create a booking for the facility
            await request(app)
                .post(`/facilities/book/${facilityId}`)
                .send(TEST_BOOKING);
        });

        it('should get all bookings for a facility', async () => {
            const res = await request(app)
                .get(`/facilities/${facilityId}/bookings`);

            expect(res.statusCode).to.equal(200);
            expect(res.body).to.have.property('bookings');
            expect(res.body.bookings).to.be.an('array');
            expect(res.body.bookings.length).to.be.greaterThan(0);
            expect(res.body.bookings[0]).to.have.property('userEmail', TEST_BOOKING.userEmail);
        });

        it('should return 404 for non-existent facility', async () => {
            const res = await request(app)
                .get('/facilities/000000000000000000000000/bookings');

            expect(res.statusCode).to.equal(404);
            expect(res.body).to.have.property('status', 'error');
        });
    });
});

// Do not close mongoose connection here if you have other test files