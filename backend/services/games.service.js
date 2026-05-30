import { Game } from "../models/games.js";
import { User } from "../models/users.js";
import { Comment } from "../models/comments.js";
import { updateElo } from "./elo.service.js";

export async function attachUsernames(games) {
    const userIds = [...new Set(
        games.flatMap(g => [
            ...g.players.map(p => p.userId),
            ...(g.winnerId != null ? [g.winnerId] : [])
        ])
    )];
    const users = await User.find({ userId: { $in: userIds }}, {userId: 1, username: 1});
    const nameById = Object.fromEntries(users.map(u => [u.userId, u.username]));

    return games.map(g => {
        const obj = g.toObject ? g.toObject() : g;
        obj.players = obj.players.map(p => ({ ...p, username: nameById[p.userId] ?? "Unknown"}));
        obj.winnerName = obj.winnerId != null ? (nameById[obj.winnerId] ?? "Unknown") : null;
        return obj;
    });
}

//Pagination
export async function getAllGames({ sort = "createdAt", limit = 10, page = 1, status }) {
    const skip = (page - 1) * limit;
    const query = {};
    if (status) query.status = { $in: status.split(',') };
    const games = await Game.find(query)
        .sort({ [sort]: -1 })
        .limit(Number(limit))
        .skip(Number(skip));
    return attachUsernames(games);
}

export async function getGameById(gameId) {
    const game = await Game.findOne({ gameId: gameId });
    if (!game) return null;
    const userIds = game.players.map(p => p.userId);
    const users = await User.find({ userId: { $in: userIds } }, { userId: 1, username: 1 });
    const usernameMap = Object.fromEntries(users.map(u => [u.userId, u.username]));
    const obj = game.toObject();
    obj.players = obj.players.map(p => ({ ...p, username: usernameMap[p.userId] ?? 'Unknown' }));
    return obj;
}

export async function createGame(data) {
    const game = await Game.create(data);
    const buyIn = data.rules?.buyIn ?? 0;
    if (buyIn > 0 && data.players?.length > 0) {
        const creatorId = data.players[0].userId;
        await User.findOneAndUpdate({ userId: creatorId }, { $inc: { points: -buyIn } });
    }
    return game;
}

export async function updateGame(gameId, status) {
    return Game.findOneAndUpdate(
        { gameId: gameId },
        status,
        { returnDocument: "after" }
    );
}

export async function recordGameResult(gameId, { players, roundTime, winnerId }) {
    // Use the winner the engine resolved (top score, tie-broken by chip stack);
    // fall back to highest score if it wasn't supplied.
    const maxScore = Math.max(...players.map(p => p.score));
    const winner = (winnerId != null && players.find(p => p.userId === winnerId))
        || players.find(p => p.score === maxScore);

    // Build arrayFilters and per-player score + final chip stack updates
    const fieldUpdates = Object.fromEntries(
        players.flatMap((p, i) => [
            [`players.$[p${i}].score`, p.score],
            [`players.$[p${i}].stack`, p.stack ?? 0]
        ])
    );
    const arrayFilters = players.map((p, i) => ({ [`p${i}.userId`]: p.userId }));

    const result = await Game.findOneAndUpdate(
        { gameId },
        {
            winnerId: winner.userId,
            status: "finished",
            ...fieldUpdates
        },
        { returnDocument: "after", arrayFilters }
    );

    await updateElo(players, roundTime);

    // Transfer buy-in points: losers lose buyIn, winner gains buyIn per loser
    for (const player of players) {
        if ((player.stack ?? 0) > 0) {
            await User.findOneAndUpdate({ userId: player.userId }, { $inc: { points: player.stack } });
        }
    }

    return result;
}

export async function joinGame(gameId, userId) {
    const game = await Game.findOne({ gameId });
    if (!game) throw new Error("Game not found");
    if (game.status !== 'pending') throw new Error("This game has already started");
    if (game.players.some(p => p.userId === userId)) throw new Error("You are already in this game");
    if (game.players.length >= game.rules.numPlayers) throw new Error("This game is full");

    const user = await User.findOne({ userId }, { elo: 1, username: 1, points: 1 });
    if (!user) throw new Error("User not found");

    const { minElo, maxElo, buyIn } = game.rules;
    if (minElo != null && user.elo < minElo) throw new Error(`Tour ELO (${user.elo}) is below this game's minimum (${minElo})`);
    if (maxElo != null && user.elo > maxElo) throw new Error(`Your ELO (${user.elo}) is above this game's maximum (${maxElo})`);
    if (buyIn > 0 && (user.points ?? 0) < buyIn) throw new Error(`You need ${buyIn} points to join this game (you have ${user.points ?? 0})`);

    if (buyIn > 0) {
        await User.findOneAndUpdate({ userId }, { $inc: { points: -buyIn} });
    }

    game.players.push({ userId });
    if (game.players.length >= game.rules.numPlayers) {
        game.status = 'in-progress';
    }
    return game.save();
}

export async function deleteGame(gameId) {
    return Game.findOneAndDelete({ gameId: gameId });
}

//Pagination
export async function getGameComments(gameId, { sort = "createdAt", limit = 10, page = 1 }) {
    const skip = (page - 1) * limit;
    const comments = await Comment.find({ gameId: gameId })
        .sort({ [sort]: -1 })
        .limit(Number(limit))
        .skip(Number(skip));
    const userIds = [...new Set(comments.map(c => c.userId))];
    const users = await User.find({ userId: { $in: userIds } }, { userId: 1, username: 1 });
    const usernameMap = Object.fromEntries(users.map(u => [u.userId, u.username]));
    return comments.map(c => ({ ...c.toObject(), username: usernameMap[c.userId] ?? 'Unknown' }));
}

export async function createGameComment(gameId, { userId, text }) {
    return Comment.create({ gameId: gameId, userId, text });
}

export async function refundPoints(userId, amount) {
    if (amount > 0) {
        await User.findOneAndUpdate({ userId }, { $inc: { points: amount } });
    }
}

export async function revertGameToPending(gameId, leaverId) {
    return Game.findOneAndUpdate(
        { gameId },
        { status: "pending", winnerId: null, $pull: { players: { userId: leaverId } } },
        { returnDocument: "after" }
    );
}


export default {
    getAllGames,
    getGameById,
    getGameComments,
    createGame,
    createGameComment,
    recordGameResult,
    updateGame,
    deleteGame,
    joinGame,
    revertGameToPending,
    refundPoints
};