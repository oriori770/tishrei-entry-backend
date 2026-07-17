import request from 'supertest';
import app from '../../index'; // Assuming we exported the app
import { UserModel } from '../../models/User';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

describe('Auth Endpoints', () => {
  beforeEach(async () => {
    await UserModel.deleteMany({});
  });

  const validUser = {
    username: 'testadmin',
    password: 'password123',
    name: 'Admin User',
    role: 'admin',
    isActive: true,
  };

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      // Create user directly via model
      const user = new UserModel(validUser);
      await user.save();

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: validUser.username,
          password: validUser.password,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('username', validUser.username.toLowerCase());
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should fail with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: validUser.username,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('שם משתמש וסיסמה נדרשים');
    });

    it('should fail with wrong password', async () => {
      const user = new UserModel(validUser);
      await user.save();

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: validUser.username,
          password: 'wrongpassword',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('שם משתמש או סיסמה שגויים');
    });

    it('should fail if user is not active', async () => {
      const user = new UserModel({ ...validUser, isActive: false });
      await user.save();

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: validUser.username,
          password: validUser.password,
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('המשתמש לא פעיל');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should retrieve profile with a valid token', async () => {
      const user = new UserModel(validUser);
      await user.save();

      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' } as any
      );

      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe(validUser.username.toLowerCase());
    });

    it('should fail without a token', async () => {
      const res = await request(app).get('/api/auth/profile');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
