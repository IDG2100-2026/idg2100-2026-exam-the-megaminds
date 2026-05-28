// Handles request/response for game routes — calls the service layer and sends back JSON
import gameService from "../services/games.service.js";

export async function getAllGames(req, res) {
    const games = await gameService.getAllGames(req.query);
    res.status(200).json({ success: true, data: games });
}

export async function getGameById(req, res) {
    const game = await gameService.getGameById(req.params.gameId);
    if (!game) return res.status(404).json({ message: "Game not found" });
    res.status(200).json({ success: true, data: game });
}

export async function createGame(req, res) {
    const newGame = await gameService.createGame(req.validData);
    res.status(201).json({ success: true, data: newGame });
}

export async function updateGame(req, res) {
    const updGame = await gameService.updateGame(req.params.gameId, req.validData);
    if (!updGame) return res.status(404).json({ message: "Game not found" });
    res.status(200).json({ success: true, data: updGame });
}

export async function recordGameResult(req, res) {
    const result = await gameService.recordGameResult(req.params.gameId, req.validData);
    if (!result) return res.status(404).json({ message: "Game not found" });
    res.status(200).json({ success: true, data: result });
}

export async function joinGame(req, res) {
    try {
        const game = await gameService.joinGame(req.params.gameId, req.userId);
        res.status(200).json({ success: true, data: game });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

export async function deleteGame(req, res) {
    const delGame = await gameService.deleteGame(req.validData.gameId);
    if (!delGame) return res.status(404).json({ message: "Game not found" });
    res.status(200).json({ success: true, message: "Game deleted successfully" });
}

export async function getGameComments(req, res) {
    const gameComments = await gameService.getGameComments(req.params.gameId, req.query);
    res.status(200).json({ success: true, data: gameComments });
}

export async function createGameComment(req, res) {
    const newComment = await gameService.createGameComment(
        req.params.gameId,
        { userId: req.userId, text: req.validData.text }
    );
    res.status(201).json({ success: true, data: newComment });
}


export default {
    getAllGames,
    getGameById,
    getGameComments,
    createGame,
    joinGame,
    createGameComment,
    recordGameResult,
    updateGame,
    deleteGame
};