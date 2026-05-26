import jwt from "jsonwebtoken";
import crypto from "crypto";

// In-memory store for short-lived WebSocket tokens: token → { userId, expiresAt }
const wsTokenStore = new Map();

const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

// Creates a signed JWT containing the userId and role
export function signToken(userId, role) {
    return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Reads the JWT from the httpOnly cookie and attaches userId + role to the request.
// Never blocks — missing or invalid token just means anonymous.
export function verifyToken(req, res, next) {
    const token = req.cookies?.token;

    if (!token) {
        req.userRole = "anonymous";
        req.userId = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userRole = decoded.role;
        req.userId = decoded.userId;
        next();
    } catch {
        // Token expired or tampered with — treat as anonymous
        req.userRole = "anonymous";
        req.userId = null;
        next();
    }
}

// Sets the JWT as an httpOnly cookie so JS cannot read it
export function setTokenCookie(res, token) {
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
    });
}

// Generates a one time token for WebSocket aut, valid for 10 seconds
export function generateWsToken(userId){
    const token = crypto.randomBytes(32).toString("hex");
    wsTokenStore.set(token, { userId, expiresAt: Date.now() + 10_000 });
    return token;
}

// Validates and consumes a wsToken - returns userId or null if invalid/expired
export function consumeWsToken(token) {
    const entry = wsTokenStore.get(token);
    if (!entry) return null;
    wsTokenStore.delete(token); // one-time use
    if (Date.now() > entry.expiresAt) return null;
    return entry.userId;
}