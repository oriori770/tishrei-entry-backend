import request from 'supertest';
import app from '../../index';
import { UserModel } from '../../models/User';
import { statisticsService } from '../../services/statisticsService';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

jest.mock('../../services/statisticsService');

describe('Statistics Endpoints', () => {
  let token: string;
  let adminUser: any;

  beforeEach(async () => {
    await UserModel.deleteMany({});

    adminUser = new UserModel({
      username: 'statadmin',
      password: 'password123',
      name: 'Stat Admin',
      role: 'admin',
      isActive: true,
    });
    await adminUser.save();

    token = jwt.sign(
      { userId: adminUser._id, role: adminUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' } as any
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Notice that in routes/statistics.ts we have:
  // router.get('/event/:eventId', requireAdmin, getEventAttendance);
  // router.get('/events', requireAdmin, getEventsAttendance);
  // router.get("/event/:eventId", requireAdmin, getEventEntries); // WARNING: This shadows the one above! However the actual route is handled based on order, the second one might not be reachable. Let's just test getEventAttendance based on what it executes.
  // router.get("/buckets", requireAdmin, getAllEntriesByBucket);

  describe('GET /api/statistics/event/:eventId', () => {
    it('should return event attendance', async () => {
      const mockData = { totalApproved: 10, totalAttended: 5, attendanceRate: 50 };
      (statisticsService.getEventAttendance as jest.Mock).mockResolvedValue(mockData);

      const res = await request(app)
        .get('/api/statistics/event/test-event-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockData);
    });

    it('should handle event not found', async () => {
      (statisticsService.getEventAttendance as jest.Mock).mockRejectedValue(new Error('Event not found'));

      const res = await request(app)
        .get('/api/statistics/event/invalid')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Event not found');
    });

    it('should handle general error', async () => {
      (statisticsService.getEventAttendance as jest.Mock).mockRejectedValue(new Error('Some error'));

      const res = await request(app)
        .get('/api/statistics/event/test-event-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(500);
    });
  });

  describe('GET /api/statistics/buckets', () => {
    it('should return entries by bucket', async () => {
      const mockData = [{ hour: '10:00', count: 5 }];
      (statisticsService.getAllEntriesByBucket as jest.Mock).mockResolvedValue(mockData);

      const res = await request(app)
        .get('/api/statistics/buckets')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockData);
    });

    it('should handle general error', async () => {
      (statisticsService.getAllEntriesByBucket as jest.Mock).mockRejectedValue(new Error('Some error'));

      const res = await request(app)
        .get('/api/statistics/buckets')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(500);
    });
  });

  describe('GET /api/statistics/events', () => {
    it('should return attendance for all events', async () => {
      const mockData = [{ eventId: '1', totalApproved: 10, totalAttended: 5, attendanceRate: 50 }];
      (statisticsService.getEventsAttendance as jest.Mock).mockResolvedValue(mockData);

      const res = await request(app)
        .get('/api/statistics/events')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockData);
    });

    it('should handle general error', async () => {
       (statisticsService.getEventsAttendance as jest.Mock).mockRejectedValue(new Error('Some error'));

      const res = await request(app)
        .get('/api/statistics/events')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(500);
    });
  });

});
