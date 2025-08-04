import { Request, Response } from 'express';
import { EntryModel } from '../models/Entry';
import { ParticipantModel } from '../models/Participant';
import { EventModel } from '../models/Event';
import { UserModel } from '../models/User';
import { ApiResponse, PaginationParams, PaginatedResponse } from '../types';

export const createEntry = async (req: any, res: Response): Promise<void> => {
  try {
    const { participantId, eventId, method = 'barcode' } = req.body;
    const scannerId = req.user._id;

    // Validate required fields
    if (!participantId || !eventId) {
      res.status(400).json({
        success: false,
        error: 'מזהה משתתף ומזהה אירוע נדרשים'
      });
      return;
    }

    // Check if participant exists
    const participant = await ParticipantModel.findById(participantId);
    if (!participant) {
      res.status(404).json({
        success: false,
        error: 'משתתף לא נמצא'
      });
      return;
    }

    // Check if event exists and is active
    const event = await EventModel.findById(eventId);
    if (!event) {
      res.status(404).json({
        success: false,
        error: 'אירוע לא נמצא'
      });
      return;
    }

    if (!event.isActive) {
      res.status(400).json({
        success: false,
        error: 'האירוע לא פעיל'
      });
      return;
    }

    // Check if entry already exists
    const existingEntry = await EntryModel.findOne({
      participantId,
      eventId
    });

    if (existingEntry) {
      res.status(400).json({
        success: false,
        error: 'משתתף זה כבר נכנס לאירוע זה'
      });
      return;
    }

    // Create entry
    const entry = new EntryModel({
      participantId,
      eventId,
      scannerId,
      method,
      entryTime: new Date()
    });

    await entry.save();

    // Populate entry with details
    const populatedEntry = await EntryModel.findById(entry._id)
      .populate('participantId')
      .populate('eventId')
      .populate('scannerId', '-password');

    res.status(201).json({
      success: true,
      data: populatedEntry,
      message: 'כניסה נרשמה בהצלחה'
    });
  } catch (error) {
    console.error('Create entry error:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשרת'
    });
  }
};

export const createEntryByBarcode = async (req: any, res: Response): Promise<void> => {
  try {
    const { barcode, eventId, method = 'barcode' } = req.body;
    const scannerId = req.user._id;

    // Validate required fields
    if (!barcode || !eventId) {
      res.status(400).json({
        success: false,
        error: 'ברקוד ומזהה אירוע נדרשים'
      });
      return;
    }

    // Find participant by barcode
    const participant = await ParticipantModel.findOne({ barcode });
    if (!participant) {
      res.status(404).json({
        success: false,
        error: 'משתתף לא נמצא'
      });
      return;
    }

    // Check if event exists and is active
    const event = await EventModel.findById(eventId);
    if (!event) {
      res.status(404).json({
        success: false,
        error: 'אירוע לא נמצא'
      });
      return;
    }

    if (!event.isActive) {
      res.status(400).json({
        success: false,
        error: 'האירוע לא פעיל'
      });
      return;
    }

    // Check if entry already exists
    const existingEntry = await EntryModel.findOne({
      participantId: participant._id,
      eventId
    });

    if (existingEntry) {
      res.status(400).json({
        success: false,
        error: 'משתתף זה כבר נכנס לאירוע זה'
      });
      return;
    }

    // Create entry
    const entry = new EntryModel({
      participantId: participant._id,
      eventId,
      scannerId,
      method,
      entryTime: new Date()
    });

    await entry.save();

    // Populate entry with details
    const populatedEntry = await EntryModel.findById(entry._id)
      .populate('participantId')
      .populate('eventId')
      .populate('scannerId', '-password');

    res.status(201).json({
      success: true,
      data: populatedEntry,
      message: 'כניסה נרשמה בהצלחה'
    });
  } catch (error) {
    console.error('Create entry by barcode error:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשרת'
    });
  }
};

export const getAllEntries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, sortBy = 'entryTime', sortOrder = 'desc', eventId, participantId } = req.query as PaginationParams & { eventId?: string; participantId?: string };

    const query: any = {};
    
    if (eventId) {
      query.eventId = eventId;
    }
    
    if (participantId) {
      query.participantId = participantId;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort: any = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [entries, total] = await Promise.all([
      EntryModel.find(query)
        .populate('participantId')
        .populate('eventId')
        .populate('scannerId', '-password')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      EntryModel.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    const response: ApiResponse<PaginatedResponse<any>> = {
      success: true,
      data: {
        data: entries,
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
    console.error('Get all entries error:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשרת'
    });
  }
};

export const getEntryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const entry = await EntryModel.findById(id)
      .populate('participantId')
      .populate('eventId')
      .populate('scannerId', '-password');

    if (!entry) {
      res.status(404).json({
        success: false,
        error: 'כניסה לא נמצאה'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Get entry by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשרת'
    });
  }
};

export const deleteEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const entry = await EntryModel.findByIdAndDelete(id);

    if (!entry) {
      res.status(404).json({
        success: false,
        error: 'כניסה לא נמצאה'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'כניסה נמחקה בהצלחה'
    });
  } catch (error) {
    console.error('Delete entry error:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשרת'
    });
  }
};

export const getEntriesByEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 10 } = req.query as PaginationParams;

    const skip = (Number(page) - 1) * Number(limit);

    const [entries, total] = await Promise.all([
      EntryModel.find({ eventId })
        .populate('participantId')
        .populate('eventId')
        .populate('scannerId', '-password')
        .sort({ entryTime: -1 })
        .skip(skip)
        .limit(Number(limit)),
      EntryModel.countDocuments({ eventId })
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    const response: ApiResponse<PaginatedResponse<any>> = {
      success: true,
      data: {
        data: entries,
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
    console.error('Get entries by event error:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשרת'
    });
  }
};

export const getEntryStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;

    const [totalEntries, entriesByMethod] = await Promise.all([
      EntryModel.countDocuments({ eventId }),
      EntryModel.aggregate([
        { $match: { eventId: eventId } },
        { $group: { _id: '$method', count: { $sum: 1 } } }
      ])
    ]);

    const methodStats = entriesByMethod.reduce((acc: any, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        totalEntries,
        methodStats,
        barcodeEntries: methodStats.barcode || 0,
        manualEntries: methodStats.manual || 0
      }
    });
  } catch (error) {
    console.error('Get entry stats error:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשרת'
    });
  }
}; 

export const checkParticipantEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { participantId, eventId } = req.params;

    const entry = await EntryModel.findOne({
      participantId,
      eventId
    });

    res.status(200).json({
      success: true,
      data: {
        isCheckedIn: !!entry,
        entry: entry ? await EntryModel.findById(entry._id)
          .populate('participantId')
          .populate('eventId')
          .populate('scannerId', '-password') : null
      }
    });
  } catch (error) {
    console.error('Check participant entry error:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשרת'
    });
  }
}; 

export const getGeneralEntryStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [totalEntries, entriesByMethod, recentEntries] = await Promise.all([
      EntryModel.countDocuments(),
      EntryModel.aggregate([
        { $group: { _id: '$method', count: { $sum: 1 } } }
      ]),
      EntryModel.find()
        .populate('participantId')
        .populate('eventId')
        .populate('scannerId', '-password')
        .sort({ entryTime: -1 })
        .limit(10)
    ]);

    const methodStats = entriesByMethod.reduce((acc: any, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        totalEntries,
        methodStats,
        barcodeEntries: methodStats.barcode || 0,
        manualEntries: methodStats.manual || 0,
        recentEntries
      }
    });
  } catch (error) {
    console.error('Get general entry stats error:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשרת'
    });
  }
}; 