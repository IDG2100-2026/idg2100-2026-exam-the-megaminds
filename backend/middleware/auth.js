import { User } from '../models/users.js';
import { verifyAccessToken, clearAccessCookie } from "./jwt.js";

import SecurityIncident from "../models/securityIncident.js";

export async function identifyUser(req, res, next) {
    const token = req.cookies?.accessToken;

    if (!token) {
        req.userRole = "anonymous";
        req.userId = null;
        return next();
    }

    let decoded;
    try {
        decoded = verifyAccessToken(token);
    } catch {

        req.userRole = "anonymous";
        req.userId = null;
        return next();
    }

    if (decoded.ip && decoded.ip !== req.ip) {
        await SecurityIncident.create({
            type: "ip-change",
            userId: decoded.userId,
            ip: req.ip,
            tokenIp: decoded.ip,
            userAgent: req.get("user-agent"),
            path: req.originalUrl
        });
        clearAccessCookie(res);
        return res.status(401).json({ success: false, code: "IP_MISMATCH", message: "Access token IP mismatch" });
    }

    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
}

export function requireRegistered(req, res, next) {
    if (req.userRole === "anonymous") {
        return res.status(401).json({ success: false, message: "You must be logged in to perform this action" });
    }
    next();
}

export function requireAdmin(req, res, next) {

    if (req.userRole === "anonymous") {
        return res.status(401).json({ success: false, message: "You must be logged in to perform this action" });
    }
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
