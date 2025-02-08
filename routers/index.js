import { Router } from "express";
import { loginuser } from "../controllers/loginController/index.js";
import { registeruser } from "../controllers/registerController/index.js";
import { eventcreate } from "../controllers/eventCreateController/index.js";
import { authenticateToken } from "../aunthecation/index.js";
import { getingevents } from "../controllers/gettingeventController/index.js";
import { updateattendee } from "../controllers/updateAttendee/index.js";
import { leaveattendee } from "../controllers/leaveattendee/index.js";

const router = Router()

router.post('/login', loginuser)

router.post('/register', registeruser)

router.post('/events', authenticateToken, eventcreate)

router.get('/events', getingevents)

router.post('/events/:eventId/attendees',authenticateToken, updateattendee)

router.post('/events/:eventId/leave', authenticateToken, leaveattendee)

export default router