import { Request, Response } from "express";
import { statisticsService, EventEntry, EntryBucket, AttendanceResult } from "../services/statisticsService";

export const statisticsController = {
  async getEventEntries(req: Request, res: Response): Promise<void> {
    try {
      const entries: EventEntry[] = await statisticsService.getEventEntries(req.params.eventId);
      res.json(entries);
    } catch (err: any) {
      if (err.message === "Invalid eventId") {
        res.status(400).json({ error: err.message });
      } else {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch event entries" });
      }
    }
  },

  async getAllEntriesByBucket(_req: Request, res: Response): Promise<void> {
    try {
      const buckets: EntryBucket[] = await statisticsService.getAllEntriesByBucket();
      res.json(buckets);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch all entries by bucket" });
    }
  },

  async getEventAttendance(req: Request, res: Response): Promise<void> {
    try {
      const result: AttendanceResult = await statisticsService.getEventAttendance(req.params.eventId);
      res.json(result);
    } catch (error: any) {
      if (error.message === "Event not found") {
        res.status(404).json({ error: error.message });
      } else {
        console.error(error);
        res.status(500).json({ error: "Failed to calculate attendance" });
      }
    }
  },

  async getEventsAttendance(_req: Request, res: Response): Promise<void> {
    try {
      const results: AttendanceResult[] = await statisticsService.getEventsAttendance();
      res.json(results);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to calculate attendance for events" });
    }
  },
};