import jwt from 'jsonwebtoken'
import { User } from "../../mongooseSchema/usersSchema/index.js";
  
export const loginuser = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email, password });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  
    const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET);
    res.json({ token, status:200, username:email });
}
