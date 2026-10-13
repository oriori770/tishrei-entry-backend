import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { ApiResponse, PaginationParams, PaginatedResponse, UserRole } from '../types';

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', role, isActive } = req.query as PaginationParams & { role?: string; isActive?: string };

    const query: any = {};
    
    if (role) {
      query.role = role;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort: any = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [users, total] = await Promise.all([
      UserModel.find(query).select('-password')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      UserModel.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    const response: ApiResponse<PaginatedResponse<any>> = {
      success: true,
      data: {
        data: users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages
        }
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשרת'
    });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id).select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'משתמש לא נמצא'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשרת'
    });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const creatorRole = (req as any).user?.role;
    const requestedRole = req.body.role || UserRole.Scanner;

    // מנהל רגיל רשאי ליצור סורקים בלבד
    if (creatorRole === UserRole.Admin) {
      if (requestedRole !== UserRole.Scanner) {
        res.status(403).json({
          success: false,
          error: 'מנהל רגיל רשאי ליצור סורקים בלבד'
        });
        return;
      }
    } else if (creatorRole === UserRole.SuperAdmin) {
      if (requestedRole === UserRole.SuperAdmin) {
        res.status(400).json({
          success: false,
          error: 'לא ניתן ליצור מנהל כללי נוסף'
        });
        return;
      }
    }

    const user = new UserModel({
      ...req.body,
      role: requestedRole
    });
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete (userResponse as any).password;

    res.status(201).json({
      success: true,
      data: userResponse,
      message: 'משתמש נוצר בהצלחה'
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    
    if (error.code === 11000 || error.message === 'שם משתמש זה כבר קיים במערכת') {
      res.status(400).json({
        success: false,
        error: 'שם משתמש זה כבר קיים במערכת'
      });
      return;
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        error: errors.join(', ')
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'שגיאה בשרת'
    });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;
    const targetUser = await UserModel.findById(id);

    if (!targetUser) {
      res.status(404).json({
        success: false,
        error: 'משתמש לא נמצא'
      });
      return;
    }

    // הגנה על מנהל כללי: רק הוא יכול לערוך את עצמו
    if (targetUser.role === UserRole.SuperAdmin && currentUser.role !== UserRole.SuperAdmin) {
      res.status(403).json({
        success: false,
        error: 'אין הרשאה לערוך מנהל כללי'
      });
      return;
    }

    // מנהל רגיל אינו רשאי לערוך מנהל אחר
    if (currentUser.role === UserRole.Admin && targetUser.role === UserRole.Admin && targetUser._id.toString() !== currentUser._id.toString()) {
      res.status(403).json({
        success: false,
        error: 'מנהל רגיל אינו רשאי לערוך מנהלים אחרים'
      });
      return;
    }

    const updateData = { ...req.body };
    delete updateData.password;

    // שינוי תפקיד
    if (updateData.role && updateData.role !== targetUser.role) {
      if (currentUser.role !== UserRole.SuperAdmin) {
        res.status(403).json({
          success: false,
          error: 'רק מנהל כללי רשאי לשנות תפקיד'
        });
        return;
      }
      if (targetUser.role === UserRole.SuperAdmin) {
        res.status(400).json({
          success: false,
          error: 'לא ניתן לשנות את התפקיד של המנהל הכללי'
        });
        return;
      }
      if (updateData.role === UserRole.SuperAdmin) {
        res.status(400).json({
          success: false,
          error: 'לא ניתן לקדם משתמש למנהל כללי'
        });
        return;
      }
    }

    Object.assign(targetUser, updateData);
    await targetUser.save();

    const userResponse = targetUser.toObject();
    delete (userResponse as any).password;

    res.status(200).json({
      success: true,
      data: userResponse,
      message: 'משתמש עודכן בהצלחה'
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        error: 'שם משתמש זה כבר קיים במערכת'
      });
      return;
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        error: errors.join(', ')
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'שגיאה בשרת'
    });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;
    const targetUser = await UserModel.findById(id);

    if (!targetUser) {
      res.status(404).json({
        success: false,
        error: 'משתמש לא נמצא'
      });
      return;
    }

    // לא ניתן למחוק מנהל כללי בשום מצב
    if (targetUser.role === UserRole.SuperAdmin) {
      res.status(403).json({
        success: false,
        error: 'לא ניתן למחוק את המנהל הכללי'
      });
      return;
    }

    // מנהל רגיל רשאי למחוק סורקים בלבד
    if (currentUser.role === UserRole.Admin && targetUser.role !== UserRole.Scanner) {
      res.status(403).json({
        success: false,
        error: 'מנהל רגיל רשאי למחוק סורקים בלבד'
      });
      return;
    }

    await UserModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'משתמש נמחק בהצלחה'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשרת'
    });
  }
};

export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;
    const user = await UserModel.findById(id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'משתמש לא נמצא'
      });
      return;
    }

    // לא ניתן להשבית מנהל כללי
    if (user.role === UserRole.SuperAdmin) {
      res.status(403).json({
        success: false,
        error: 'לא ניתן להשבית את המנהל הכללי'
      });
      return;
    }

    // מנהל רגיל רשאי להשבית סורקים בלבד
    if (currentUser.role === UserRole.Admin && user.role !== UserRole.Scanner) {
      res.status(403).json({
        success: false,
        error: 'מנהל רגיל רשאי להשבית סורקים בלבד'
      });
      return;
    }

    user.isActive = !user.isActive;
    await user.save();

    const userResponse = user.toObject();
    delete (userResponse as any).password;

    res.status(200).json({
      success: true,
      data: userResponse,
      message: `משתמש ${user.isActive ? 'הופעל' : 'הושבת'} בהצלחה`
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשרת'
    });
  }
};

export const getScanners = async (req: Request, res: Response): Promise<void> => {
  try {
    const scanners = await UserModel.find({ 
      role: { $in: [UserRole.Scanner, UserRole.Admin, UserRole.SuperAdmin] },
      isActive: true 
    }).select('-password');

    res.status(200).json({
      success: true,
      data: scanners
    });
  } catch (error) {
    console.error('Get scanners error:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשרת'
    });
  }
};

export const resetUserPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const currentUser = (req as any).user;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: 'סיסמה חדשה חייבת להיות לפחות 6 תווים'
      });
      return;
    }

    const user = await UserModel.findById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'משתמש לא נמצא'
      });
      return;
    }

    if (user.role === UserRole.SuperAdmin && currentUser.role !== UserRole.SuperAdmin) {
      res.status(403).json({
        success: false,
        error: 'אין הרשאה לאפס סיסמה למנהל כללי'
      });
      return;
    }

    if (currentUser.role === UserRole.Admin && user.role !== UserRole.Scanner) {
      res.status(403).json({
        success: false,
        error: 'מנהל רגיל רשאי לאפס סיסמה לסורקים בלבד'
      });
      return;
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'סיסמה אופסה בהצלחה'
    });
  } catch (error) {
    console.error('Reset user password error:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשרת'
    });
  }
}; 