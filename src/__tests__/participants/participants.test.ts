import request from 'supertest';
import app from '../../index';
import { ParticipantModel } from '../../models/Participant';
import { UserModel } from '../../models/User';
import jwt from 'jsonwebtoken';

describe('Participant Endpoints', () => {
  let token: string;

  beforeEach(async () => {
    await ParticipantModel.deleteMany({});
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

    token = jwt.sign(
      { userId: adminUser._id, role: adminUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' } as any
    );
  });

  const validParticipant = {
    name: 'Israel',
    family: 'Israeli',
    phone: '0501234567',
    groupType: 'תיכון',
    city: 'Jerusalem'
  };

  describe('POST /api/participants', () => {
    it('should create a participant successfully', async () => {
      const res = await request(app)
        .post('/api/participants')
        .set('Authorization', `Bearer ${token}`)
        .send(validParticipant);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('barcode');
      expect(res.body.data.name).toBe(validParticipant.name);
    });

    it('should fail if missing required fields', async () => {
      const res = await request(app)
        .post('/api/participants')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Israel'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail without authorization', async () => {
      const res = await request(app)
        .post('/api/participants')
        .send(validParticipant);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/participants', () => {
    it('should retrieve a list of participants', async () => {
      // Create test participant
      const participant = new ParticipantModel(validParticipant);
      await participant.save();

      const res = await request(app)
        .get('/api/participants')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe(validParticipant.name);
    });
  });

  describe('GET /api/participants/barcode/:barcode', () => {
    it('should retrieve a participant by barcode', async () => {
      // Create test participant
      const participant = new ParticipantModel(validParticipant);
      await participant.save();

      const res = await request(app)
        .get(`/api/participants/barcode/${participant.barcode}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.barcode).toBe(participant.barcode);
    });

    it('should return 404 for invalid barcode', async () => {
      const res = await request(app)
        .get('/api/participants/barcode/invalidbarcode123')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});