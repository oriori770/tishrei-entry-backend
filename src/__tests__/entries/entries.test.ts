import request from 'supertest';
import app from '../../index';
import { EntryModel } from '../../models/Entry';
import { ParticipantModel } from '../../models/Participant';
import { EventModel } from '../../models/Event';
import { UserModel } from '../../models/User';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

describe('Entry Endpoints', () => {
  let token: string;
  let adminUser: any;
  let participant: any;
  let event: any;

  beforeEach(async () => {
    await EntryModel.deleteMany({});
    await ParticipantModel.deleteMany({});
    await EventModel.deleteMany({});
    await UserModel.deleteMany({});

    adminUser = new UserModel({
      username: 'testadmin',
      password: 'password123',
      name: 'Admin User',
      role: 'admin',
      isActive: true,
    });
    await adminUser.save();

    token = jwt.sign(
      { userId: adminUser._id, role: adminUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' } as any
    );

    participant = new ParticipantModel({
      idNumber: '123456789',
      name: 'John Doe',
      firstName: 'John',
      family: 'Doe',
      groupType: 'Student',
      phone: '0501234567',
      isApproved: true,
      barcode: 'test-barcode-123'
    });
    await participant.save();

    event = new EventModel({
      name: 'Test Event',
      date: new Date(),
      location: 'Test Location',
      isActive: true
    });
    await event.save();
  });

  describe('POST /api/entries', () => {
    it('should create an entry successfully', async () => {
      const res = await request(app)
        .post('/api/entries')
        .set('Authorization', `Bearer ${token}`)
        .send({
          participantId: participant._id,
          eventId: event._id,
          method: 'manual'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.participantId._id.toString()).toBe(participant._id.toString());
    });

    it('should fail with missing fields', async () => {
      const res = await request(app)
        .post('/api/entries')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail for double entry', async () => {
        await request(app)
        .post('/api/entries')
        .set('Authorization', `Bearer ${token}`)
        .send({
          participantId: participant._id,
          eventId: event._id,
        });

        const res2 = await request(app)
        .post('/api/entries')
        .set('Authorization', `Bearer ${token}`)
        .send({
          participantId: participant._id,
          eventId: event._id,
        });

        expect(res2.statusCode).toBe(409);
        expect(res2.body.success).toBe(false);
    });
  });

  describe('POST /api/entries/barcode', () => {
    it('should create an entry successfully via barcode', async () => {
      const res = await request(app)
        .post('/api/entries/barcode')
        .set('Authorization', `Bearer ${token}`)
        .send({
          barcode: participant.barcode,
          eventId: event._id,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/entries', () => {
    it('should retrieve a list of entries', async () => {
      const entry = new EntryModel({
          participantId: participant._id,
          eventId: event._id,
          scannerId: adminUser._id,
          method: 'manual'
      });
      await entry.save();

      const res = await request(app)
        .get('/api/entries')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/entries/:id', () => {
    it('should retrieve an entry by id', async () => {
      const entry = new EntryModel({
          participantId: participant._id,
          eventId: event._id,
          scannerId: adminUser._id,
          method: 'manual'
      });
      await entry.save();

      const res = await request(app)
        .get(`/api/entries/${entry._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id.toString()).toBe(entry._id.toString());
    });
  });

  describe('DELETE /api/entries/:id', () => {
    it('should delete an entry successfully', async () => {
      const entry = new EntryModel({
          participantId: participant._id,
          eventId: event._id,
          scannerId: adminUser._id,
          method: 'manual'
      });
      await entry.save();

      const res = await request(app)
        .delete(`/api/entries/${entry._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/entries/event/:eventId', () => {
    it('should retrieve entries for an event', async () => {
      const entry = new EntryModel({
          participantId: participant._id,
          eventId: event._id,
          scannerId: adminUser._id,
          method: 'manual'
      });
      await entry.save();

      const res = await request(app)
        .get(`/api/entries/event/${event._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.data.length).toBe(1);
    });
  });

  describe('GET /api/entries/stats/:eventId', () => {
    it('should retrieve entry stats for an event', async () => {
        const entry = new EntryModel({
            participantId: participant._id,
            eventId: event._id,
            scannerId: adminUser._id,
            method: 'barcode'
        });
        await entry.save();

      const res = await request(app)
        .get(`/api/entries/stats/${event._id.toString()}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalEntries).toBe(1);
      expect(res.body.data.barcodeEntries).toBe(1);
    });
  });

  describe('GET /api/entries/check/:participantId/:eventId', () => {
    it('should check if participant entered an event', async () => {
        const entry = new EntryModel({
            participantId: participant._id,
            eventId: event._id,
            scannerId: adminUser._id,
            method: 'barcode'
        });
        await entry.save();

      const res = await request(app)
        .get(`/api/entries/check/${participant._id}/${event._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isCheckedIn).toBe(true);
    });
  });

  describe('GET /api/entries/stats', () => {
    it('should retrieve general entry stats', async () => {
        const entry = new EntryModel({
            participantId: participant._id,
            eventId: event._id,
            scannerId: adminUser._id,
            method: 'barcode'
        });
        await entry.save();

      const res = await request(app)
        .get('/api/entries/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalEntries).toBeGreaterThanOrEqual(1);
    });
  });

});
