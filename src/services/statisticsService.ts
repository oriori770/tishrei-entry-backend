import mongoose from "mongoose";
import { EntryModel } from "../models/Entry";
import { EventModel } from "../models/Event";
import { ParticipantModel } from "../models/Participant";

const BUCKET_SIZE = 1000 * 60 * 5; // 5 דקות

export const statisticsService = {
  async getEventEntries(eventId: string) {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new Error("Invalid eventId");
    }

    return EntryModel.find({
      eventId: new mongoose.Types.ObjectId(eventId),
    })
      .select("entryTime participantId method")
      .sort({ entryTime: 1 });
  },

  async getAllEntriesByBucket() {
    return EntryModel.aggregate([
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

  async getEventAttendance(eventId: string) {
    const event = await EventModel.findById(eventId);

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

  async getEventsAttendance() {
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
        };
      })
    );
  },
};