const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const moment = require('moment')

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// === MongoDB Connection ===
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.once('open', () => console.log('Connected to MongoDB'));

// === User Model ===
const userSchema = new mongoose.Schema({ username: String, password: String, email: String });
const User = mongoose.model('eventList', userSchema);

// === Event Model ===
const eventSchema = new mongoose.Schema({
  name: String,
  description: String,
  dateTime: Date,
  owner: String,
  attendees: { type: [String], default: [] }
});
const Event = mongoose.model('Event', eventSchema);

// === JWT Middleware ===
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};


// === Routes ===
// User Registration
app.post('/api/register', async (req, res) => {
  const { username, password , email} = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ error: 'User already exists' });
  const newUser = new User({ username, password, email });
  await newUser.save();
  res.json({ message: 'User registered successfully' });
});

// User Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email, password });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET);
  res.json({ token, status:200, username:email });
});

// { expiresIn: '1h' }
// Create Event
app.post('/api/events', authenticateToken, async (req, res) => {
  const { name, descreption, date } = req.body;
  const event = new Event({ name, description : descreption, dateTime: new Date(date), owner: req.user.username });
  await event.save();
  io.emit('attendee_updated', { eventId: event._id, attendees: event.attendees });
  res.json(event);
});

app.get('/api/events', async (req, res) => {
  const { date } = req.query;
  try {
    let query = {};

    if (date) {
      const today = moment().startOf('day');

      if (date === 'yesterday') {
        query.dateTime = {
          $gte: today.clone().subtract(1, 'days').toDate(),
          $lt: today.toDate(),
        };
      } else if (date === 'today') {
        query.dateTime = {
          $gte: today.toDate(),
          $lt: today.clone().add(1, 'days').toDate(),
        };
      } else if (date === 'tomorrow') {
        query.dateTime = {
          $gte: today.clone().add(1, 'days').toDate(),
          $lt: today.clone().add(2, 'days').toDate(),
        };
      }
    }

    const events = await Event.find(query);
    if (events) {
      res.json(events);
    } else {
      res.json({message:'no eents there'})
    }

  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


//update the event users
app.post('/api/events/:eventId/attendees', authenticateToken, async (req, res) => {
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
});

// leaving attendee
// app.post('/api/events/:eventId/leave', async (req, res) => {
//   const { currentEventId, userId } = req.body;
 
  
//   try {
//     const event = await Event.findById(currentEventId);
//     if (!event) return res.status(404).json({ error: 'Event not found' });

//     // Remove attendee if present
//     event.attendees = event.attendees.filter((username) => username !== userId);
//     await event.save();

//     // Notify other clients
//     io.emit('attendee_updated', { currentEventId, attendees: event.attendees.length });

//     res.json({ message: 'Left event successfully' });
//   } catch (err) {
//     res.status(500).json({ error: 'Error leaving event' });
//   }
// });

app.post('/api/events/:eventId/leave', authenticateToken, async (req, res) => {
  const { eventId } = req.params;
  const { username } = req.user;

  try {
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Remove attendee if present
    event.attendees = event.attendees.filter((attendee) => attendee !== username);
    await event.save();

    // Notify clients about the update
    io.emit('attendee_updated', { eventId, attendees: event.attendees });

    res.json({ message: 'Left event successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error leaving event' });
  }
});



// Real-time Updates
io.on('connection', (socket) => {
  console.log('Client connected');
  socket.on('disconnect', () => console.log('Client disconnected'));
});

// Start Server
const PORT = process.env.PORT || 5500;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
