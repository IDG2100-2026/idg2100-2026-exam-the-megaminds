import userService from "../services/users.service.js";
import { ErrorLog } from "../models/errorLog.js";

export async function banUser(req, res) {
    const user = await userService.unbanUser(Number(req.params.userId));
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
}

export async function unBanUser(req, res) {
    const user = await userService.unBanUser(Number(req.params.userId));
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
}

export async function setUserRole(req, res) {
    const { isAdmin } = req.body;
    if (typeof isAdmin !== "boolean") {
        return res.status(400).json({ success: false, message: "isAdmin must be a boolean" });   
    }
    const user = await userService.updateUser(Number(req.params.userId), { isAdmin });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
}

export async function logError(req, res) {
    const {message, stack, url, userAgent } = req.body;
    if (!message) return res.status(400).json({ success: false, message: "message is required" });
    await ErrorLog.create({
        type: "frontend",
        message: String(message).slice(0, 2000),
        stack: stack ? String(stack).slice(0, 5000) : null,
        url: url ? String(url).slice(0, 500) : null,
        userAgent: userAgent ? String(userAgent).slice(0, 300) : null,
        userId: req.userId ?? null
    });
    res.status(201).json({ success: true });
}

export async function getErrorLogs(req, res) {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
        ErrorLog.find().toSorted({ createdAt: -1 }).limit(limit).skip(skip),
        ErrorLog.countDocuments()
    ]);
}

export default { banUser, unBanUser, setUserRole, logError, getErrorLogs };