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