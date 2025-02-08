import { io } from "../../index.js";
import { Event } from "../../mongooseSchema/eventScema/index.js";

export const leaveattendee = async (req, res) => {
  const { eventId } = req.params;
  const { username } = req.user;

  try {
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    // Remove attendee if present
    event.attendees = event.attendees.filter(
      (attendee) => attendee !== username
    );
    await event.save();

    // Notify clients about the update
    io.emit("attendee_updated", { eventId, attendees: event.attendees });

    res.json({ message: "Left event successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error leaving event" });
  }
};
