import express from 'express'
import mongoose from 'mongoose';
import cors from 'cors'
import { Server } from 'socket.io';
import http from 'http'
import router from './routers/index.js';
import env from 'dotenv'


env.config()
const app = express();

export const server = http.createServer(app);
export const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

app.use('/api', router)

// === MongoDB Connection ===
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.once('open', () => console.log('Connected to MongoDB'));




// Real-time Updates
io.on('connection', (socket) => {
  console.log('Client connected');
  socket.on('disconnect', () => console.log('Client disconnected'));
});

// Start Server
const PORT = process.env.PORT || 5500;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

