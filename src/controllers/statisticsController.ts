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
// אחוז נוכחות לאירוע בודד
export const getEventAttendance = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // משתתפים שנרשמו עד מועד האירוע
    const totalRegistered = await Participant.countDocuments({
      createdAt: { $lte: event.date },
    });

    // כניסות בפועל
    const totalEntered = await Entry.countDocuments({ eventId: event._id });

    const percent =
      totalRegistered > 0
        ? (totalEntered / totalRegistered) * 100
        : 0;

    res.json({
      eventId: event._id,
      name: event.name,
      date: event.date,
      totalRegistered,
      totalEntered,
      percent: percent.toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to calculate attendance" });
  }
};

// אחוזי נוכחות לכל האירועים
export const getEventsAttendance = async (_req: Request, res: Response) => {
  try {
    const events = await Event.find({ isPast: true }).lean();

    const results = await Promise.all(
      events.map(async (event) => {
        const totalRegistered = await Participant.countDocuments({
          createdAt: { $lte: event.date },
        });

        const totalEntered = await Entry.countDocuments({ eventId: event._id });

        const percent =
          totalRegistered > 0
            ? (totalEntered / totalRegistered) * 100
            : 0;

        return {
          eventId: event._id,
          name: event.name,
          date: event.date,
          totalRegistered,
          totalEntered,
          percent: percent.toFixed(2),
        };
      })
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to calculate attendance for events" });
  }
};