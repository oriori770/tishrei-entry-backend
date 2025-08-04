import mongoose, { Schema, Document } from 'mongoose';
import { Event } from '../types';

export interface EventDocument extends Event, Document {}

const eventSchema = new Schema<EventDocument>({
  name: {
    type: String,
    required: [true, 'שם האירוע הוא שדה חובה'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'תאריך האירוע הוא שדה חובה']
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
eventSchema.index({ date: 1 });
eventSchema.index({ isActive: 1 });
eventSchema.index({ name: 1 });

// Virtual for formatted date
eventSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('he-IL');
});

// Virtual for checking if event is in the past
eventSchema.virtual('isPast').get(function() {
  return this.date < new Date();
});

// Virtual for checking if event is today
eventSchema.virtual('isToday').get(function() {
  const today = new Date();
  const eventDate = new Date(this.date);
  return eventDate.toDateString() === today.toDateString();
});

export const EventModel = mongoose.model<EventDocument>('Event', eventSchema); 