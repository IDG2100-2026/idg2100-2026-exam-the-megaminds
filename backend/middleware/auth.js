import { User } from '../models/users.js';
import { verifyAccessToken, clearAuthCookies } from "./jwt.js";
import SecurityIncident from "../models/securityIncident.js";

// Attaches userId + role to every request.
//  - no token / expired / tampered  -> anonymous, never blocks
//  - valid token but issued to a different IP -> log incident, clear cookie, 401
//    (the frontend then silently hits /refresh, which re-stamps the new IP)
export async function identifyUser(req, res, next) {
    const token = req.cookies?.accessToken;

    // 1. No token at all — just an anonymous visitor.
    if (!token) {
        req.userRole = "anonymous";
        req.userId = null;
        return next();
    }

    // 2. Token present — is the signature valid and not expired?
    let decoded;
    try {
        decoded = verifyAccessToken(token);
    } catch {
        // expired or tampered -> treat as anonymous; a protected guard will 401 and trigger a refresh
        req.userRole = "anonymous";
        req.userId = null;
        return next();
    }

    // 3. Valid token, but the IP it was minted for no longer matches the caller.
    if (decoded.ip && decoded.ip !== req.ip) {
        await SecurityIncident.create({
            type: "ip-change",
            userId: decoded.userId,
            ip: req.ip,                    // who is calling now
            tokenIp: decoded.ip,           // who the token was issued to
            userAgent: req.get("user-agent"),
            path: req.originalUrl,
        });
        clearAuthCookies(res);             // force a clean refresh on the next request
        return res.status(401).json({ success: false, code: "IP_MISMATCH", message: "Access token IP mismatch" });
    }

    // Token valid and IP matches — the request is authenticated.
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
}

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
