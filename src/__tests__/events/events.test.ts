import request from 'supertest';
import app from '../../index';
import { EventModel } from '../../models/Event';
import { UserModel } from '../../models/User';
import jwt from 'jsonwebtoken';

describe('Event Endpoints', () => {
  let adminToken: string;
  let scannerToken: string;

  beforeEach(async () => {
    await EventModel.deleteMany({});
    await UserModel.deleteMany({});

    // Create admin user for token
    const adminUser = new UserModel({
      username: 'admin',
      password: 'password123',
      name: 'Admin',
      role: 'admin',
      isActive: true,
    });
    await adminUser.save();

    adminToken = jwt.sign(
      { userId: adminUser._id, role: adminUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' } as any
    );

    // Create scanner user for token
    const scannerUser = new UserModel({
      username: 'scanner',
      password: 'password123',
      name: 'Scanner',
      role: 'scanner',
      isActive: true,
    });
    await scannerUser.save();

    scannerToken = jwt.sign(
      { userId: scannerUser._id, role: scannerUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' } as any
    );
  });

  const validEvent = {
    name: 'Tishrei Holiday Gathering',
    date: new Date().toISOString(),
    description: 'A beautiful gathering for Tishrei',
    isActive: true
  };

  describe('POST /api/events', () => {
    it('should create an event successfully as admin', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validEvent);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(validEvent.name);
    });

    it('should fail to create event as scanner (forbidden)', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${scannerToken}`)
        .send(validEvent);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/events', () => {
    it('should retrieve a list of events', async () => {
      const event = new EventModel(validEvent);
      await event.save();

      const res = await request(app)
        .get('/api/events')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.data.length).toBe(1);
      expect(res.body.data.data[0].name).toBe(validEvent.name);
    });
  });

  describe('GET /api/events/active', () => {
    it('should retrieve only active events', async () => {
      const activeEvent = new EventModel(validEvent);
      await activeEvent.save();

      const inactiveEvent = new EventModel({
        name: 'Inactive Event',
        date: new Date().toISOString(),
        isActive: false
      });
      await inactiveEvent.save();

      const res = await request(app)
        .get('/api/events/active')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe(validEvent.name);
    });
  });
});