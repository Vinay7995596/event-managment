import jwt from 'jsonwebtoken'
import { User } from "../../mongooseSchema/usersSchema/index.js";

export const registeruser = async(req, res) => {
    const { username, password , email} = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ error: 'User already exists' });
    const newUser = new User({ username, password, email });
    await newUser.save();
    res.json({ message: 'User registered successfully' });

}