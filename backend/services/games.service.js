import { Game } from "../models/games.js";
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
    return Game.findOne({ gameId: gameId });
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
    return result;
}

export async function deleteGame(gameId) {
    return Game.findOneAndDelete({ gameId: gameId });
}

//Pagination
export async function getGameComments(gameId, { sort = "createdAt", limit = 10, page = 1 }) {
    const skip = (page - 1) * limit;
    return Comment.find({ gameId: gameId })
        .sort({ [sort]: -1 })
        .limit(Number(limit))
        .skip(Number(skip));
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