import { ErrorLog } from "../models/errorLog.js";

export async function errorHandler(err, req, res, next) {
    const status = err.status ?? 500;

    if (status === 500) {
        try {
            await ErrorLog.create({
                type: "backend",
                message: err.message ?? "Unknown error",
                stack: err.stack ? err.stack.slice(0, 5000) : null,
                url: req.originalUrl,
                userAgent: req.headers["user-agent"] ?? null,
                userId: req.userId ?? null
            });
        } catch { /* don't let logging cause another crash */ }
    }

    res.status(status).json({ success: false, message: err.message ?? "Internal server error" });
}