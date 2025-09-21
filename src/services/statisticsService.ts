import mongoose from "mongoose";
import { EntryModel } from "../models/Entry";
import { EventModel } from "../models/Event";
import { ParticipantModel } from "../models/Participant";

// טיפוס לכניסה בודדת
export interface EventEntry {
  entryTime: Date;
  participantId: mongoose.Types.ObjectId;
  method: string;
}

// טיפוס ל־Bucket
export interface EntryBucket {
  _id: Date;
  count: number;
}

// טיפוס לאחוזי נוכחות
export interface AttendanceResult {
  eventId: mongoose.Types.ObjectId ;
  name: string;
  date: Date;
  totalRegistered: number;
  totalEntered: number;
  percent: string; // מחרוזת עם 2 ספרות אחרי הנקודה
}
interface EventLean {
  _id: mongoose.Types.ObjectId;
  name: string;
  date: Date;
  isPast: boolean;
}

const BUCKET_SIZE = 1000 * 60 * 5; // 5 דקות

export const statisticsService = {
  async getEventEntries(eventId: string): Promise<EventEntry[]> {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new Error("Invalid eventId");
    }

    return EntryModel.find({
      eventId: new mongoose.Types.ObjectId(eventId),
    })
      .select("entryTime participantId method")
      .sort({ entryTime: 1 })
      .lean<EventEntry[]>(); // lean מחזיר אובייקט רגיל
  },

  async getAllEntriesByBucket(): Promise<EntryBucket[]> {
    return EntryModel.aggregate<EntryBucket>([
      {
        $group: {
          _id: {
            $toDate: {
              $subtract: [
                { $toLong: "$entryTime" },
                { $mod: [{ $toLong: "$entryTime" }, BUCKET_SIZE] },
              ],
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  },

  async getEventAttendance(eventId: string): Promise<AttendanceResult> {
    const events = await EventModel.find({ isPast: true }).lean<EventLean[]>();
    if (!event) {
      throw new Error("Event not found");
    }

    const totalRegistered = await ParticipantModel.countDocuments({
      createdAt: { $lte: event.date },
    });

    const totalEntered = await EntryModel.countDocuments({ eventId: event._id });

    const percent =
      totalRegistered > 0 ? (totalEntered / totalRegistered) * 100 : 0;

    return {
      eventId: event._id,
      name: event.name,
      date: event.date,
      totalRegistered,
      totalEntered,
      percent: percent.toFixed(2),
    };
  },

  async getEventsAttendance(): Promise<AttendanceResult[]> {
    const events = await EventModel.find({ isPast: true }).lean();

    return Promise.all(
      events.map(async (event) => {
        const totalRegistered = await ParticipantModel.countDocuments({
          createdAt: { $lte: event.date },
        });

        const totalEntered = await EntryModel.countDocuments({
          eventId: event._id,
        });

        const percent =
          totalRegistered > 0 ? (totalEntered / totalRegistered) * 100 : 0;

        return {
          eventId: event._id,
          name: event.name,
          date: event.date,
          totalRegistered,
          totalEntered,
          percent: percent.toFixed(2),
        } as AttendanceResult;
      })
    );
  },
};