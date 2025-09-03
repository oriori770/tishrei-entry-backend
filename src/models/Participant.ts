import mongoose, { Schema, Document } from 'mongoose';
import { GroupType } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface Participant extends Document {
  name: string;
  family: string;
  barcode: string;
  phone: string;
  city?: string;
  groupType: GroupType;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface ParticipantDocument extends Participant, Document {
  fullName: string;
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
    unique: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'טלפון הוא שדה חובה'],
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  groupType: {
    type: String,
    //enum: Object.values(GroupType),
    required: [true, 'סוג קבוצה הוא שדה חובה']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
participantSchema.index({ phone: 1 }, { unique: true });

// Virtual for full name
participantSchema.virtual('fullName').get(function() {
  return `${this.name} ${this.family}`;
});

participantSchema.pre('save', function (next) {
  if (!this.barcode) {
    this.barcode = uuidv4(); // שמור רק UUID
  }
  next();
});

export const ParticipantModel = mongoose.model<ParticipantDocument>('Participant', participantSchema); 