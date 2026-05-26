import { User } from '../models/users.js';
import { verifyToken } from "./jwt.js";

// Attaches userId and role to every request — never blocks
export { verifyToken as identifyUser };

// Guard: only registered users and admins may proceed
export function requireRegistered(req, res, next) {
    if (req.userRole === "anonymous") {
        return res.status(401).json({ success: false, message: "You must be logged in to perform this action" });
    }
    next();
}

// Guard: only admins may proceed
export function requireAdmin(req, res, next) {
    if (req.userRole !== "admin") {
        return res.status(403).json({ success: false, message: "Admin access required" });
    }
    next();
}

export async function requireEmailVerified(req, res, next) {
    if(!req.userId) {
        return res.status(401).json({ success: false, message: 'Not logged in' });
    }
    const user = await User.findOne({ userId: req.userId }).select('emailVerified');
    if (!user || !user.emailVerified) {
        return res.status(403).json({ success: false, message: 'Please verify your email before playing' });
    }
    next();
}