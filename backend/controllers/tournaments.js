// Handles request/response for tournament routes — calls the service layer and sends back JSON
import tournamentService from "../services/tournaments.service.js";
import { broadcastToTournament } from "../websocket/gameSocket.js";

export async function getAllTournaments(req, res) {
    const tournaments = await tournamentService.getAllTournaments(req.query);
    res.status(200).json({ success: true, data: tournaments });
}

export async function getTournamentById(req, res) {
    const tournament = await tournamentService.getTournamentById(req.params.tournamentId);
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });
    res.status(200).json({ success: true, data: tournament });
}

export async function createTournament(req, res) {
    const newTournament = await tournamentService.createTournament(req.validData);
    res.status(201).json({ success: true, data: newTournament });
}

export async function updateTournament(req, res) {
    const updTournament = await tournamentService.updateTournament(req.params.tournamentId, req.validData);
    if (!updTournament) return res.status(404).json({ message: "Tournament not found" });
    res.status(200).json({ success: true, data: updTournament });
}

export async function deleteTournament(req, res) {
    const delTournament = await tournamentService.deleteTournament(req.params.tournamentId);
    if (!delTournament) return res.status(404).json({ message: "Tournament not found" });
    res.status(200).json({ success: true, message: "Tournament deleted successfully" });
}

export async function joinTournament(req, res) {
    const tournament = await tournamentService.joinTournament(req.params.tournamentId, req.validData);
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });
    res.status(200).json({ success: true, data: tournament });
}

export async function leaveTournament(req, res) {
    const tournament = await tournamentService.leaveTournament(req.params.tournamentId, req.params.userId);
    if(!tournament) return res.status(404).json({message: "Tournament not found"});
    res.status(200).json({ success: true, data: tournament });
}

export async function getStandings(req, res) {
    const standings = await tournamentService.getStandings(req.params.tournamentId);
    res.status(200).json({ success: true, data: standings });
}

export async function getTournamentGames(req, res) {
    const games = await tournamentService.getTournamentGames(req.params.tournamentId);
    res.status(200).json({ success: true, data: games });
}


export async function getTournamentComments(req, res) {
    const comments = await tournamentService.getTournamentComments(req.params.tournamentId, req.query);
    res.status(200).json({ success: true, data: comments });
}

export async function createTournamentComment(req, res) {
    const newComment = await tournamentService.createTournamentComment(req.params.tournamentId, { userId: req.userId, text: req.validData.text });
    broadcastToTournament(req.params.tournamentId, {type: "new-comment", comment: newComment});
    res.status(201).json({ success: true, data: newComment });
}

export async function awardWinner(req, res) {
    const tournament = await tournamentService.awardWinner(req.params.tournamentId, req.validData.winnerId);
    res.status(200).json({ success: true, data: tournament });
}

export async function startTournament(req, res) {
    const tournament = await tournamentService.startTournament(req.params.tournamentId);
    res.status(200).json({ success: true, data: tournament });
}

export async function advanceTournament(req, res) {
    const tournament = await tournamentService.advanceTournament(req.params.tournamentId);
    res.status(200).json({ success: true, data: tournament });
}

export default {
    getAllTournaments, getTournamentById, getTournamentComments,
    createTournament, createTournamentComment, joinTournament,
    updateTournament, deleteTournament, awardWinner, startTournament, advanceTournament,
    leaveTournament, getStandings, getTournamentGames
};
