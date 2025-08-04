import mongoose, { Schema, Document } from 'mongoose';
import { Entry } from '../types';

export interface EntryDocument extends Entry, Document {}

const entrySchema = new Schema<EntryDocument>({
  participantId: {
    type: Schema.Types.ObjectId,
    ref: 'Participant',
    required: [true, 'מזהה משתתף הוא שדה חובה']
  },
  eventId: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'מזהה אירוע הוא שדה חובה']
  },
  scannerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'מזהה סורק הוא שדה חובה']
  },
  entryTime: {
    type: Date,
    default: Date.now,
    required: [true, 'זמן כניסה הוא שדה חובה']
  },
  method: {
    type: String,
    enum: ['barcode', 'manual'],
    default: 'barcode',
    required: [true, 'שיטת כניסה היא שדה חובה']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
entrySchema.index({ participantId: 1 });
entrySchema.index({ eventId: 1 });
entrySchema.index({ scannerId: 1 });
entrySchema.index({ entryTime: 1 });
entrySchema.index({ participantId: 1, eventId: 1 }); // Compound index for unique entries

// Ensure unique participant per event (one entry per participant per event)
entrySchema.index(
  { participantId: 1, eventId: 1 }, 
  { unique: true }
);

// Virtual for formatted entry time
entrySchema.virtual('formattedEntryTime').get(function() {
  return this.entryTime.toLocaleString('he-IL');
});

// Pre-save middleware to check for duplicate entries
entrySchema.pre('save', async function(next) {
  if (this.isNew) {
    const existingEntry = await mongoose.model('Entry').findOne({
      participantId: this.participantId,
      eventId: this.eventId
    });
    
    if (existingEntry) {
      throw new Error('משתתף זה כבר נכנס לאירוע זה');
    }
  }
  next();
});

export const EntryModel = mongoose.model<EntryDocument>('Entry', entrySchema); 