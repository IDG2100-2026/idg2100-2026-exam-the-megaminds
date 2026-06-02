import SecurityIncident from "../models/securityIncident.js";

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 100;

const AUTH_FREE = ["/login", "/refresh", "/logout"];

const hits = new Map();

export async function rateLimit(req, res, next) {

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
