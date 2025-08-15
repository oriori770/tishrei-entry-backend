import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { UserRole } from '../types';

interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ 
        success: false, 
        error: 'נדרש טוקן אימות' 
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    const user = await UserModel.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      res.status(401).json({ 
        success: false, 
        error: 'משתמש לא נמצא או לא פעיל' 
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'הטוקן פג תוקף'
    });
  }
    res.status(401).json({ 
      success: false, 
      error: 'טוקן לא תקין' 
    });
  }
};

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        error: 'נדרש אימות' 
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ 
        success: false, 
        error: 'אין לך הרשאה לבצע פעולה זו' 
      });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole([UserRole.Admin]);
export const requireScanner = requireRole([UserRole.Scanner, UserRole.Admin]); 