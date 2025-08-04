import mongoose, { Schema, Document } from 'mongoose';
import { Participant, GroupType } from '../types';

export interface ParticipantDocument extends Participant, Document {}

const participantSchema = new Schema<ParticipantDocument>({
  name: {
    type: String,
    required: [true, 'שם הוא שדה חובה'],
    trim: true
  },
  family: {
    type: String,
    required: [true, 'שם משפחה הוא שדה חובה'],
    trim: true
  },
  barcode: {
    type: String,
    required: [true, 'ברקוד הוא שדה חובה'],
    unique: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'טלפון הוא שדה חובה'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'אימייל הוא שדה חובה'],
    lowercase: true,
    trim: true
  },
  city: {
    type: String,
    required: [true, 'עיר היא שדה חובה'],
    trim: true
  },
  schoolClass: {
    type: String,
    required: [true, 'כיתה היא שדה חובה'],
    trim: true
  },
  branch: {
    type: String,
    required: [true, 'סניף הוא שדה חובה'],
    trim: true
  },
  groupType: {
    type: String,
    enum: Object.values(GroupType),
    required: [true, 'סוג קבוצה הוא שדה חובה']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
participantSchema.index({ barcode: 1 });
participantSchema.index({ email: 1 });
participantSchema.index({ groupType: 1 });
participantSchema.index({ branch: 1 });

// Virtual for full name
participantSchema.virtual('fullName').get(function() {
  return `${this.name} ${this.family}`;
});

// Pre-save middleware to ensure unique barcode
participantSchema.pre('save', async function(next) {
  if (this.isModified('barcode')) {
    const existingParticipant = await mongoose.model('Participant').findOne({ 
      barcode: this.barcode,
      _id: { $ne: this._id }
    });
    
    if (existingParticipant) {
      throw new Error('ברקוד זה כבר קיים במערכת');
    }
  }
  next();
});

export const ParticipantModel = mongoose.model<ParticipantDocument>('Participant', participantSchema); 