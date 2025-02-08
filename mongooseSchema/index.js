import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  name: String,
  description: String,
  dateTime: Date,
  owner: String,
  attendees: { type: [String], default: [] }
});


export const Event = mongoose.model('Event', eventSchema);