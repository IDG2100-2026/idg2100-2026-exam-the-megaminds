// Global error handler — must be registered last in server.js
export function errorHandler(err, req, res, next) {
    // Use the error's own status code if it has one, otherwise fall back to 500
    const status = err.status ?? 500;
    res.status(status).json({ success: false, message: err.message ?? "Internal server error" });
}
