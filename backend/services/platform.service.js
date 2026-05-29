import { Game } from "../models/games.js";

// Returns a snapshot of current platform activity
 
export async function getPlatformActivity() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const gamePlayedWeek = await Game.countDocuments({ status: "finished", updatedAt: { $gte: oneWeekAgo } });

    // Count games currently being played
    const ongoingGames = await Game.countDocuments({ status: "in-progress" });

    // Use MongoDB aggregation to count distinct active users in the last week — much more efficient than fetching all and processing in JS
    const activeUsersAgg = await Game.aggregate([
        { $match: { createdAt: { $gte: oneWeekAgo } } },
        { $unwind: "$players" },
        { $group: { _id: null, uniqueUsers: { $addToSet: "$players.userId" } } },
        { $project: { count: { $size: "$uniqueUsers" } } }
    ]);

    const activeUsersWeek = activeUsersAgg.length > 0 ? activeUsersAgg[0].count : 0;

    // Last 10 finished games with relevant fields only
    const recentGames = await Game.find({ status: "finished" })
        .sort({ updatedAt: -1 })
        .limit(10)
        .select("gameId players winnerId rules status updatedAt");

    return {
        ongoingGames,
        activeUsersWeek,
        gamePlayedWeek,
        recentGames
    };
}

export default { getPlatformActivity };
