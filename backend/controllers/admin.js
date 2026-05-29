import userService from "../services/users.service.js";
import SecurityIncident from "../models/securityIncident.js";
import { User } from "../models/users.js";
import platformService from "../services/platform.service.js";
import { ErrorLog } from "../models/errorLog.js";

export async function getDashboard(req, res) {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [newProfiles, incidentCounts, recentIncidents, activity] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
        SecurityIncident.aggregate([
            { $group: { _id: "$type", count: { $sum: 1} } }
        ]),

        SecurityIncident.find()
            .sort({ createdAt: -1})
            .limit(20)
            .select("type userId ip tokenIp userAgent path createdAt"),

        platformService.getPlatformActivity()
    ]);
    const incidents = { "ip-change": 0, "rate-limit": 0};
    for (const row of incidentCounts) incidents[row._id] = row.count;

    res.json({
        success: true,
        data: {
            newProfilesLastWeek: newProfiles,
            incidents,
            recentIncidents,
            activity
        }
    });
}


export async function banUser(req, res) {
    const user = await userService.banUser(Number(req.params.userId));
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
}

export async function unbanUser(req, res) {
    const user = await userService.unbanUser(Number(req.params.userId));
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
        ErrorLog.find().sort({ createdAt: -1 }).limit(limit).skip(skip),
        ErrorLog.countDocuments()
    ]);
    res.json({ success: true, data: logs, total, page, limit });
}

export default { banUser, unbanUser, setUserRole, logError, getErrorLogs, getDashboard };