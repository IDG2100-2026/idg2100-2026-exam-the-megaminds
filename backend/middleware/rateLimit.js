import SecurityIncident from "../models/securityIncident.js";

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 100;

// Auth endpoints must never be metered: a 429 here would block the silent
// token refresh, locking users out until the window resets.
const AUTH_FREE = ["/login", "/refresh", "/logout"];

const hits = new Map();

export async function rateLimit(req, res, next) {
    // Only meter mutating traffic. Read-heavy pages (tournament detail fans out to
    // many GETs) and the auth endpoints shouldn't trip the abuse detector.
    if (req.method === "GET" || AUTH_FREE.includes(req.path)) return next();

    const ip = req.ip;
    const now = Date.now();
    let entry = hits.get(ip);

    if (!entry || now - entry.windowStart >= WINDOW_MS) {
        entry = { count: 0, windowStart: now, flagged: false };
        hits.set(ip, entry);
    }
    
    entry.count++;

    if (entry.count > MAX_REQUESTS) {
        if (!entry.flagged) {
            entry.flagged = true;
            await SecurityIncident.create({
                type: "rate-limit",
                userId: req.userId ?? null,
                ip,
                userAgent: req.get("user-agent"),
                path: req.originalUrl
            });
        }
        return res.status(429).json({ success: false, message: "Too many requests"});
    }

    next();
}

// Test Script to see if rate limit incident logging works 
// for (let i = 1; i <= 105; i++) {
//   const r = await fetch('http://localhost:8476/api/platform/activity', { credentials: 'include' });
//   if (i % 20 === 0 || r.status === 429) console.log(i, r.status);
// }
