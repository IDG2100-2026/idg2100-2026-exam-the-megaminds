import { User } from "../models/users.js";

export async function getLeaderboard({ sort = "elo", order = "desc", limit = 10, page = 1 }) {
    const skip = (page - 1) * limit;
    // Accepted sort fields — if the client sends something else, default to "elo"
    const validSortFields = ["elo", "wins", "totalGames", "eloChangeLastWeek", "winPercentage"];
    const sortField = validSortFields.includes(sort) ? sort : "elo";
    // Mongoose uses 1 for ascending and -1 for descending
    const sortOrder = order === "asc" ? 1 : -1;
    return User.find()
        .sort({ [sortField]: sortOrder })
        .limit(Number(limit))
        .skip(Number(skip))
        // Only return the fields needed for the leaderboard, not the full user document
        .select("userId username elo eloChangeLastWeek wins losses totalGames winPercentage");
}

export default { getLeaderboard };
