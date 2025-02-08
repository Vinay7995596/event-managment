import { io } from "../../index.js";
import { Event } from "../../mongooseSchema/eventScema/index.js";

export const updateattendee = async(req, res) => {
    const { eventId } = req.params;
    try {
      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ error: 'Event not found' });
  
      // Avoid duplicate attendees
      if (!event.attendees.includes(req.user.username)) {
        event.attendees.push(req.user.username);
        await event.save();
  
        // Notify other clients
        io.emit('attendee_updated', { eventId, attendees: event.attendees.length });
      }
  
      res.json(event);
    } catch (err) {
      res.status(500).json({ error: 'Error updating attendees' });
    }
}
