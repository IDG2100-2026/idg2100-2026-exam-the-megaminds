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

export async function recordGameResult(gameId, { winnerId, loserId, winnerScore, loserScore }) {
    const result = await Game.findOneAndUpdate(
        { gameId: gameId },
        { 
            winnerId,
            status: "finished",
            // Dot notation to update a field inside each player subdocument in the players array
            "players.$[winner].score": winnerScore,
            "players.$[loser].score": loserScore
        },
        { 
            returnDocument: "after",
            // arrayFilters tells Mongoose which array element each positional placeholder refers to
            arrayFilters: [
                { "winner.userId": winnerId },
                { "loser.userId": loserId }
            ]
        }
    );
    // Recalculate ELO ratings for both players after the result is saved
    await updateElo(winnerId, loserId);
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