import { io } from "../../index.js";
import { Event } from "../../mongooseSchema/eventScema/index.js";




export const eventcreate = async (req, res) => {
    const { name, descreption, date } = req.body;
    const event = new Event({ name, description : descreption, dateTime: new Date(date), owner: req.user.username });
    await event.save();
    io.emit('attendee_updated', { eventId: event._id, attendees: event.attendees });
    res.json(event);
}
