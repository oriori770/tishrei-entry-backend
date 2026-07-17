import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserModel } from '../models/User';
import { LoginRequest, LoginResponse, ApiResponse } from '../types';
import { sendEmail } from '../services/emailService';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password }: LoginRequest = req.body;
    
    // Validate input
    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: 'שם משתמש וסיסמה נדרשים'
      });
      return;
    }

    // Find user
    const user = await UserModel.findOne({ username: username.toLowerCase() });
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'שם משתמש או סיסמה שגויים'
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        error: 'המשתמש לא פעיל'
      });
      return;
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'שם משתמש או סיסמה שגויים'
      });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as any
    );

    // Remove password from response
    const userResponse = user.toObject() as any;
    delete userResponse.password;

    const response: ApiResponse<LoginResponse> = {
      success: true,
      data: {
        token,
        user: userResponse
      },
      message: 'התחברות הצליחה'
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשרת'
    });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ success: false, error: 'אנא ספק כתובת אימייל' });
      return;
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      res.status(404).json({ success: false, error: 'לא נמצא משתמש עם כתובת אימייל זו' });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token to store in DB
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Token expires in 1 hour
    const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);

    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();

    // Create reset url (this should point to your frontend)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const message = `
      <h1>איפוס סיסמה</h1>
      <p>ביקשת לאפס את הסיסמה שלך.</p>
      <p>אנא לחץ על הקישור הבא כדי לאפס את הסיסמה (תקף לשעה אחת):</p>
      <a href="${resetUrl}" target="_blank">${resetUrl}</a>
      <p>אם לא ביקשת זאת, אנא התעלם מהודעה זו.</p>
    `;

    try {
      const emailSent = await sendEmail({
        to: user.email!,
        subject: 'איפוס סיסמה - מערכת ניהול כניסות',
        html: message,
      });

      if (!emailSent) {
        throw new Error('שגיאה בשליחת האימייל');
      }

      res.status(200).json({ success: true, message: 'אימייל לאיפוס סיסמה נשלח בהצלחה' });
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      console.error('Error sending password reset email:', emailError);
      res.status(500).json({ success: false, error: 'לא ניתן לשלוח אימייל. נסה שוב מאוחר יותר.' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, error: 'שגיאה בשרת' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ success: false, error: 'סיסמה חדשה חייבת להיות לפחות 6 תווים' });
      return;
    }

    // Hash token to compare with DB
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await UserModel.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: new Date() } // Check if token hasn't expired
    });

    if (!user) {
      res.status(400).json({ success: false, error: 'פג תוקפו של האסימון או שהוא אינו חוקי' });
      return;
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'סיסמה שונתה בהצלחה' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'שגיאה בשרת' });
  }
};

export const getProfile = async (req: any, res: Response): Promise<void> => {
  try {
    const user = await UserModel.findById(req.user._id).select('-password');
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'משתמש לא נמצא'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
      message: 'פרופיל משתמש'
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשרת'
    });
  }
};

export const changePassword = async (req: any, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: 'סיסמה נוכחית וסיסמה חדשה נדרשות'
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: 'סיסמה חדשה חייבת להיות לפחות 6 תווים'
      });
      return;
    }

    const user = await UserModel.findById(req.user._id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'משתמש לא נמצא'
      });
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      res.status(400).json({
        success: false,
        error: 'סיסמה נוכחית שגויה'
      });
      return;
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'סיסמה שונתה בהצלחה'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשרת'
    });
  }
}; 