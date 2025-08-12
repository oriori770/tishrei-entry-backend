import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { LoginRequest, LoginResponse, ApiResponse } from '../types';

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