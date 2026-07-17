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
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'אנא הכנס כתובת אימייל חוקית']
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
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
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});


// Method to compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};


// Ensure unique username
userSchema.pre('save', async function () {
  if (!this.isModified('username')) return;

  const existingUser = await mongoose.model<UserDocument>('User').findOne({
    username: this.username,
    _id: { $ne: this._id }
  });

  if (existingUser) {
    throw new Error('שם משתמש זה כבר קיים במערכת');
  }
});


export const UserModel = mongoose.model<UserDocument>('User', userSchema);