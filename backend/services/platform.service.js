import { Game } from "../models/games.js";
import { User } from "../models/users.js";
import { attachUsernames } from "./games.service.js";

// Returns a snapshot of current platform activity
 
export async function getPlatformActivity() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Count games currently being played
    const ongoingGames = await Game.countDocuments({ status: "in-progress" });

    const availibleGames = await Game.countDocuments({ status: "pending"});

    const playedGamesWeek = await Game.countDocuments({ status: "finished", createdAt: { $gte: oneWeekAgo } });
    // Use MongoDB aggregation to count distinct active users in the last week — much more efficient than fetching all and processing in JS
    const activeUsersAgg = await Game.aggregate([
        { $match: { createdAt: { $gte: oneWeekAgo } } },
        { $unwind: "$players" },
        { $group: { _id: null, uniqueUsers: { $addToSet: "$players.userId" } } },
        { $project: { count: { $size: "$uniqueUsers" } } }
    ]);

    const activeUsersWeek = activeUsersAgg.length > 0 ? activeUsersAgg[0].count : 0;

    // Last 10 finished games with relevant fields only
    const recentGames = await attachUsernames(
        await Game.find({ status: "finished" })
            .sort({ updatedAt: -1 })
            .limit(10)
            .select("gameId players winnerId rules status updatedAt")
    );

    return {
        ongoingGames,
        availibleGames,
        playedGamesWeek,
        activeUsersWeek,
        recentGames
    };
}

export default { getPlatformActivity };
