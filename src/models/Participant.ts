import mongoose, { Schema, Document } from 'mongoose';
import { Participant, GroupType } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface ParticipantDocument extends Document {
  name: string;
  family: string;
  barcode: string;
  phone: string;
  email: string;
  city: string;
  groupType: GroupType;
  createdAt?: Date;
  updatedAt?: Date;
}

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
    unique: true,
    trim: true
  },
  city: {
    type: String,
    required: [true, 'עיר היא שדה חובה'],
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
participantSchema.index({ email: 1 });
participantSchema.index({ groupType: 1 });
participantSchema.index({ branch: 1 });

// Virtual for full name
participantSchema.virtual('fullName').get(function() {
  return `${this.name} ${this.family}`;
});

participantSchema.pre('save', function (next) {
  if (!this.barcode) {
    const data = {
      id: uuidv4(),
      name: this.fullName,  // משתמש ב-virtual fullName
      email: this.email
    };
    this.barcode = JSON.stringify(data);
  }
  next();
});

export const ParticipantModel = mongoose.model<ParticipantDocument>('Participant', participantSchema); 