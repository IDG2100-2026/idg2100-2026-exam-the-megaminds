import leaderboardService from "../services/leaderboard.service.js";

export async function getLeaderboard(req, res) {
    const leaderboard = await leaderboardService.getLeaderboard(req.query);
    res.status(200).json({ success: true, data: leaderboard });
}

export default { getLeaderboard };
