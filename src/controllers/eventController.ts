import { Request, Response } from 'express';
import { EventModel } from '../models/Event';
import { ApiResponse, PaginationParams, PaginatedResponse } from '../types';

export const getAllEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 100, sortBy = 'date', sortOrder = 'desc', isActive } = req.query as PaginationParams & { isActive?: string };

    const query: any = {};
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort: any = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [events, total] = await Promise.all([
      EventModel.find(query)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      EventModel.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    const response: ApiResponse<PaginatedResponse<any>> = {
      success: true,
      data: {
        data: events,
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
    console.error('Get all events error:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשרת'
    });
  }
};

export const getEventById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await EventModel.findById(id);

    if (!event) {
      res.status(404).json({
        success: false,
        error: 'אירוע לא נמצא'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Get event by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשרת'
    });
  }
};

export const createEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = new EventModel(req.body);
    await event.save();

    res.status(201).json({
      success: true,
      data: event,
      message: 'אירוע נוצר בהצלחה'
    });
  } catch (error: any) {
    console.error('Create event error:', error);
    
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

export const updateEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await EventModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!event) {
      res.status(404).json({
        success: false,
        error: 'אירוע לא נמצא'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: event,
      message: 'אירוע עודכן בהצלחה'
    });
  } catch (error: any) {
    console.error('Update event error:', error);
    
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

export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await EventModel.findByIdAndDelete(id);

    if (!event) {
      res.status(404).json({
        success: false,
        error: 'אירוע לא נמצא'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'אירוע נמחק בהצלחה'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשרת'
    });
  }
};

export const getActiveEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const events = await EventModel.find({ isActive: true }).sort({ date: 1 });

    res.status(200).json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Get active events error:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשרת'
    });
  }
};

export const toggleEventStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await EventModel.findById(id);

    if (!event) {
      res.status(404).json({
        success: false,
        error: 'אירוע לא נמצא'
      });
      return;
    }

    event.isActive = !event.isActive;
    await event.save();

    res.status(200).json({
      success: true,
      data: event,
      message: `אירוע ${event.isActive ? 'הופעל' : 'הושבת'} בהצלחה`
    });
  } catch (error) {
    console.error('Toggle event status error:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשרת'
    });
  }
}; 

import { Request, Response } from "express";
import mongoose from "mongoose";
import Entry from "../models/Entry";

const BUCKET_SIZE = 1000 * 60 * 5; // 5 דקות

/**
 * כניסות לפי אירוע מסוים (ללא קיבוץ)
 */
export const getEventEntries = async (req: Request, res: Response) => {
  const { eventId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ error: "Invalid eventId" });
  }

  try {
    const entries = await Entry.find({ eventId: new mongoose.Types.ObjectId(eventId) })
      .select("entryTime participantId method")
      .sort({ entryTime: 1 });

    res.json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch event entries" });
  }
};

/**
 * כניסות מכל האירועים יחד, בקיבוץ של 5 דקות
 */
export const getAllEntriesByBucket = async (_req: Request, res: Response) => {
  try {
    const buckets = await Entry.aggregate([
      {
        $group: {
          _id: {
            $toDate: {
              $subtract: [
                { $toLong: "$entryTime" },
                { $mod: [{ $toLong: "$entryTime" }, BUCKET_SIZE] }
              ]
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(buckets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch all entries by bucket" });
  }
};