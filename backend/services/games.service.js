import { Game } from "../models/games.js";
import { User } from "../models/users.js";
import { Comment } from "../models/comments.js";
import { updateElo } from "./elo.service.js";

//Pagination
export async function getAllGames({ sort = "createdAt", limit = 10, page =1 }) {
    const skip = (page - 1) * limit;
    return Game.find()
        .sort({ [sort]: -1 })
        .limit(Number(limit))
        .skip(Number(skip));
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
    return Game.create(data);
}

export async function updateGame(gameId, status) {
    return Game.findOneAndUpdate(
        { gameId: gameId },
        status,
        { returnDocument: "after" }
    );
}

export async function recordGameResult(gameId, { players, roundTime }) {
    // Determine winner from highest score
    const maxScore = Math.max(...players.map(p => p.score));
    const winner = players.find(p => p.score === maxScore);

    // Build arrayFilters and score updates for each player
    const scoreUpdates = Object.fromEntries(
        players.map((p, i) => [`players.$[p${i}].score`, p.score])
    );
    const arrayFilters = players.map((p, i) => ({ [`p${i}.userId`]: p.userId }));

    const result = await Game.findOneAndUpdate(
        { gameId },
        {
            winnerId: winner.userId,
            status: "finished",
            ...scoreUpdates
        },
        { returnDocument: "after", arrayFilters }
    );

    await updateElo(players, roundTime);

    // Transfer buy-in points: losers lose buyIn, winner gains buyIn per loser
    const buyIn = result?.rules?.buyIn ?? 0;
    if (buyIn > 0) {
        const loserIds = players.filter(p => p.userId !== winner.userId).map(p => p.userId);
        await User.updateMany({ userId: { $in: loserIds } }, { $inc: { points: -buyIn } });
        await User.findOneAndUpdate({ userId: winner.userId }, { $inc: { points: buyIn * loserIds.length } });
    }

    return result;
}

export async function joinGame(gameId, userId) {
    const game = await Game.findOne({ gameId });
    if (!game) throw new Error("Game not found");
    if (game.status !== 'pending') throw new Error("This game has already started");
    if (game.players.some(p => p.userId === userId)) throw new Error("You are already in this game");
    if (game.players.length >= game.rules.numPlayers) throw new Error("This game is full");

    const user = await User.findOne({ userId }, { elo: 1, username: 1 });
    if (!user) throw new Error("User not found");

    const { minElo, maxElo } = game.rules;
    if (minElo != null && user.elo < minElo) throw new Error(`Your ELO (${user.elo}) is below this game's minimum (${minElo})`);
    if (maxElo != null && user.elo > maxElo) throw new Error(`Your ELO (${user.elo}) is above this game's maximum (${maxElo})`);

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

export default {
    getAllGames,
    getGameById,
    getGameComments,
    createGame,
    createGameComment,
    recordGameResult,
    updateGame,
    deleteGame
};