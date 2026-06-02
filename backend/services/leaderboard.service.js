import { User } from "../models/users.js";

export async function getLeaderboard({ sort = "elo", order = "desc", limit = 10, page = 1 }) {
    const skip = (page - 1) * limit;

    const validSortFields = ["elo", "wins", "totalGames", "eloChangeLastWeek", "winPercentage"];
    const sortField = validSortFields.includes(sort) ? sort : "elo";

    const sortOrder = order === "asc" ? 1 : -1;
    return User.find()
        .sort({ [sortField]: sortOrder })
        .limit(Number(limit))
        .skip(Number(skip))

        .select("userId username elo eloChangeLastWeek wins losses totalGames winPercentage");
}

export default { getLeaderboard };
