import request from 'supertest';
import app from '../../index';
import { UserModel } from '../../models/User';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

describe('User Endpoints', () => {
  let token: string;
  let adminUser: any;
  let normalUser: any;

  beforeEach(async () => {
    await UserModel.deleteMany({});

    adminUser = new UserModel({
      username: 'adminuser',
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

    normalUser = new UserModel({
      username: 'normaluser',
      password: 'password123',
      name: 'Normal User',
      role: 'scanner',
      isActive: true,
    });
    await normalUser.save();
  });

  describe('GET /api/users', () => {
    it('should retrieve a list of users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter users by role', async () => {
      const res = await request(app)
        .get('/api/users?role=scanner')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.length).toBe(1);
      expect(res.body.data.data[0].role).toBe('scanner');
    });
  });

  describe('GET /api/users/scanners', () => {
    it('should retrieve all active scanners', async () => {
      const res = await request(app)
        .get('/api/users/scanners')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      // Admin and scanner are both active
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should retrieve a user by ID', async () => {
      const res = await request(app)
        .get(`/api/users/${normalUser._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('normaluser');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const newUser = {
        username: 'newuser',
        password: 'password123',
        name: 'New User',
        role: 'scanner',
        isActive: true,
      };

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send(newUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('newuser');
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should handle duplicate username', async () => {
      const newUser = {
        username: 'normaluser', // already exists
        password: 'password123',
        name: 'Normal User 2',
        role: 'scanner',
        isActive: true
      };

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send(newUser);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should handle validation error', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update a user', async () => {
      const res = await request(app)
        .put(`/api/users/${normalUser._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Name');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete a user', async () => {
      const res = await request(app)
        .delete(`/api/users/${normalUser._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PATCH /api/users/:id/toggle-status', () => {
    it('should toggle a user status', async () => {
      const res = await request(app)
        .patch(`/api/users/${normalUser._id}/toggle-status`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isActive).toBe(false);
    });
  });

  describe('POST /api/users/:id/reset-password', () => {
    it('should reset a user password', async () => {
      const res = await request(app)
        .post(`/api/users/${normalUser._id}/reset-password`)
        .set('Authorization', `Bearer ${token}`)
        .send({ newPassword: 'newpassword123' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should require minimum password length', async () => {
        const res = await request(app)
        .post(`/api/users/${normalUser._id}/reset-password`)
        .set('Authorization', `Bearer ${token}`)
        .send({ newPassword: '123' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

});
