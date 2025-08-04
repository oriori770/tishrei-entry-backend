import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, UserRole } from '../types';

export interface UserDocument extends Omit<User, '_id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<UserDocument>({
  username: {
    type: String,
    required: [true, 'שם משתמש הוא שדה חובה'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'סיסמה היא שדה חובה'],
    minlength: [6, 'סיסמה חייבת להיות לפחות 6 תווים']
  },
  name: {
    type: String,
    required: [true, 'שם הוא שדה חובה'],
    trim: true
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.Scanner,
    required: [true, 'תפקיד הוא שדה חובה']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret: any) {
      delete ret.password;
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    transform: function(doc, ret: any) {
      delete ret.password;
      return ret;
    }
  }
});

// Indexes
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Pre-save middleware to ensure unique username
userSchema.pre('save', async function(next) {
  if (this.isModified('username')) {
    const existingUser = await mongoose.model('User').findOne({ 
      username: this.username,
      _id: { $ne: this._id }
    });
    
    if (existingUser) {
      throw new Error('שם משתמש זה כבר קיים במערכת');
    }
  }
  next();
});

export const UserModel = mongoose.model<UserDocument>('User', userSchema); 