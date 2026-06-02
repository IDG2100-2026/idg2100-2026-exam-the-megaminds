import { Game } from "../models/games.js";
import { attachUsernames } from "./games.service.js";

export async function getPlatformActivity() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const gamePlayedWeek = await Game.countDocuments({ status: "finished", updatedAt: { $gte: oneWeekAgo } });

    const ongoingGames = await Game.countDocuments({ status: "in-progress" });

    const availibleGames = await Game.countDocuments({ status: "pending"});

    const playedGamesWeek = await Game.countDocuments({ status: "finished", createdAt: { $gte: oneWeekAgo } });

    const activeUsersAgg = await Game.aggregate([
        { $match: { createdAt: { $gte: oneWeekAgo } } },
        { $unwind: "$players" },
        { $group: { _id: null, uniqueUsers: { $addToSet: "$players.userId" } } },
        { $project: { count: { $size: "$uniqueUsers" } } }
    ]);

    const activeUsersWeek = activeUsersAgg.length > 0 ? activeUsersAgg[0].count : 0;

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
        gamePlayedWeek,
        recentGames
    };
}

export default { getPlatformActivity };
