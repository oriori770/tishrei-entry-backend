import { Request, Response } from 'express';
import { ParticipantModel } from '../models/Participant';
import { ApiResponse, PaginationParams, PaginatedResponse } from '../types';

export const getAllParticipants = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search } = req.query as PaginationParams & { search?: string };

    const query: any = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { family: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort: any = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [participants, total] = await Promise.all([
      ParticipantModel.find(query)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      ParticipantModel.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    const response: ApiResponse<PaginatedResponse<any>> = {
      success: true,
      data: {
        data: participants,
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
    console.error('Get all participants error:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשרת'
    });
  }
};

export const getParticipantById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const participant = await ParticipantModel.findById(id);

    if (!participant) {
      res.status(404).json({
        success: false,
        error: 'משתתף לא נמצא'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: participant
    });
  } catch (error) {
    console.error('Get participant by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשרת'
    });
  }
};


export const createParticipant = async (req: Request, res: Response): Promise<void> => {
  try {
    // קבלת כל השדות מסוג String מה-scheme
    Object.entries(ParticipantModel.paths).forEach(([key, path]: [string, any]) => {
      if (path.instance === 'String' && req.body[key]) {
        req.body[key] = req.body[key].trim();
        if (key === 'email') {
          req.body[key] = req.body[key].toLowerCase();
        }
      }
    });

    const participant = new ParticipantModel(req.body);
    await participant.save();

    res.status(201).json({
      success: true,
      data: participant,
      message: 'משתתף נוצר בהצלחה'
    });
  } catch (error: any) {
    console.error('Create participant error:', error);

    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyValue)[0];
      res.status(400).json({
        success: false,
        error: `השדה "${duplicatedField}" כבר קיים במערכת`
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

export const updateParticipant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const participant = await ParticipantModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!participant) {
      res.status(404).json({
        success: false,
        error: 'משתתף לא נמצא'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: participant,
      message: 'משתתף עודכן בהצלחה'
    });
  } catch (error: any) {
    console.error('Update participant error:', error);
    
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        error: 'ברקוד או אימייל זה כבר קיים במערכת'
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

export const deleteParticipant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const participant = await ParticipantModel.findByIdAndDelete(id);

    if (!participant) {
      res.status(404).json({
        success: false,
        error: 'משתתף לא נמצא'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'משתתף נמחק בהצלחה'
    });
  } catch (error) {
    console.error('Delete participant error:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשרת'
    });
  }
};

export const getParticipantByBarcode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { barcode } = req.params;
    const participant = await ParticipantModel.findOne({ barcode });

    if (!participant) {
      res.status(404).json({
        success: false,
        error: 'משתתף לא נמצא'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: participant
    });
  } catch (error) {
    console.error('Get participant by barcode error:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשרת'
    });
  }
}; 