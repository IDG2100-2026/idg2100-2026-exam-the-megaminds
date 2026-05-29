import { Tournament } from "../models/tournaments.js";
import { Comment } from "../models/comments.js";
import { User } from "../models/users.js";
import { Game } from "../models/games.js";
import { TOURNAMENT_ROUND_LOBBY_SECONDS } from "../configs/constants.js";
import { createGame } from "./games.service.js";

export async function getAllTournaments({ sort = "startDate", limit = 10, page = 1, status, sortOrder = "asc" }) {
    const skip = (Number(page) - 1) * Number(limit);
    const dir = sortOrder === "asc" ? 1 : -1;
    const filter = status
        ? { status: { $in: status.split(",").map(s => s.trim()) } }
        : {};
    if (sort === "playerCount"){
        return Tournament.aggregate([
            { $match: filter },
            { $addFields: {playerCount: {$size: "$participants" } } },
            { $sort: {playerCount: dir } },
            { $skip: skip },
            { $limit: Number(limit) }
        ]);
    }
    return Tournament.find(filter)
        .sort({ [sort]: dir })
        .limit(Number(limit))
        .skip(Number(skip));
}


export async function getTournamentById(tournamentId) {
    return Tournament.findOne({ tournamentId: tournamentId });
}

export async function createTournament(data) {
    return Tournament.create(data);
}

export async function updateTournament(tournamentId, data) {
    return Tournament.findOneAndUpdate({ tournamentId: tournamentId }, data, { returnDocument: "after" });
}

export async function deleteTournament(tournamentId) {
    return Tournament.findOneAndDelete({ tournamentId: tournamentId });
}

export async function joinTournament(tournamentId, { userId }) {
    const tournament = await Tournament.findOne({tournamentId});
    if (!tournament) return null;

    if (tournament.status !== "pending"){
        const e = new Error("This tournament is no longer open for sign-ups"); e.status = 403; throw e;
    }
    const user = await User.findOne({ userId });
    if (!user) { const e = new Error("User does not exist"); e.status = 404; throw e; }
        const { min, max } = tournament.eloRange ?? {};

    if (min != null && user.elo < min) {
        const e = new Error(`Your Elo (${user.elo}) is below this tournament's minimum of ${min}`); e.status = 403; throw e;
    }
    if (max != null && user.elo > max) {
        const e = new Error(`Your Elo (${user.elo}) is above this tournament's maximum of ${max}`); e.status = 403; throw e;
    }

    if (tournament.buyIn > 0 && typeof user.points === "number" && user.points < tournament.buyIn){
        const e = new Error(`You need ${tournament.buyIn} points to enter; you have ${user.points}`); e.status = 403; throw e;
    }

    return Tournament.findOneAndUpdate(
        { tournamentId },
        // $addToSet adds the userId to the participants array, but only if it isn't already there
        { $addToSet: { participants: userId } },
        { returnDocument: "after" }
    );
}

export async function leaveTournament(tournamentId, userId) {
    return Tournament.findOneAndUpdate(
        {tournamentId},
        {$pull: {participants: Number(userId)} },
        {returnDocument: "after"}
    );
}

export async function getTournamentComments(tournamentId, { sort = "createdAt", limit = 10, page = 1 }) {
    const skip = (page - 1) * limit;
    return Comment.find({ tournamentId: tournamentId })
        .sort({ [sort]: -1 })
        .limit(Number(limit))
        .skip(Number(skip));
}

export async function getTournamentGames(tournamentId) {
    return Game.find({ tournamentId });
}


export async function getStandings(tournamentId){
    const tournament = await Tournament.findOne({ tournamentId });
    if (!tournament) { const e = new Error("Tournament not found"); e.status = 404; throw e; }

    const games = await Game.find({ tournamentId });

    const tally = new Map();
    for (const userId of tournament.participants) {
        tally.set(userId, { userId, points: 0, wins: 0, gamesPlayed: 0 });
    }
    for (const game of games) {
        for(const player of game.players) {
            const entry = tally.get(player.userId)
                ?? {userId: player.userId, points: 0, wins: 0, gamesPlayed: 0};
            entry.points += player.score ?? 0;
            if (game.status === "finished") {
                entry.gamesPlayed += 1;
                if (game.winnerId === player.userId) entry.wins += 1;
            }
            tally.set(player.userId, entry);
        }
    }
    return [...tally.values()].sort((a, b) => b.points - a.points || b.wins - a.wins);
}

export async function createTournamentComment(tournamentId, { userId, text }) {
    return Comment.create({ tournamentId: tournamentId, userId, text });
}

async function createRound(tournament, players, roundNumber) {
    // Shuffle for random pairing
    const shuffled = [...players];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Odd player out gets free pass to the next round
    let byeUserId = null;
    if (shuffled.length % 2 !== 0) byeUserId = shuffled.pop();

    const tournamentId = tournament.tournamentId;
    const roundGameIds = [];
    for (let i = 0; i < shuffled.length; i += 2) {
        const gameId = `t-${tournamentId}-r${roundNumber}-${i / 2}`;
        await createGame({
            gameId,
            rules: tournament.format,
            players: [{ userId: shuffled[i], score: 0 }, { userId: shuffled[i + 1], score: 0 }],
            status: "in-progress",
            tournamentId: tournamentId
        });
        roundGameIds.push(gameId);
    }

    return Tournament.findOneAndUpdate(
        { tournamentId: tournamentId },
        {
            currentRound: roundNumber,
            nextRoundStartsAt: new Date(Date.now() + TOURNAMENT_ROUND_LOBBY_SECONDS * 1000),
            $push: { games: { $each: roundGameIds }, rounds: { roundNumber, games: roundGameIds, byeUserId } }
        },
        { returnDocument: "after" }
    );
}

// Validates the tournament is ready to start, then delegates to createRound for round 1
export async function startTournament(tournamentId) {
    const tournament = await Tournament.findOne({ tournamentId: tournamentId });
    if (!tournament) { const e = new Error("Tournament not found"); e.status = 404; throw e; }
    if (tournament.status !== "pending") { const e = new Error("Tournament has already started"); e.status = 400; throw e; }
    if (tournament.participants.length < tournament.minPlayers) {
        const e = new Error(`Not enough players. Need at least ${tournament.minPlayers}, have ${tournament.participants.length}`);
        e.status = 400; throw e;
    }
    await Tournament.findOneAndUpdate({ tournamentId: tournamentId }, { status: "in-progress" });
    return createRound(tournament, tournament.participants, 1);
}

// Confirms all round games are done, collects winners, then delegates to createRound for the next round
export async function advanceTournament(tournamentId) {
    const tournament = await Tournament.findOne({ tournamentId: tournamentId });
    if (!tournament) { const e = new Error("Tournament not found"); e.status = 404; throw e; }
    if (tournament.status !== "in-progress") { const e = new Error("Tournament is not in progress"); e.status = 400; throw e; }

    const currentRound = tournament.rounds.find(r => r.roundNumber === tournament.currentRound);
    if (!currentRound) { const e = new Error("No active round found"); e.status = 400; throw e; }

    const roundGames = await Game.find({ gameId: { $in: currentRound.games } });
    if (!roundGames.every(g => g.status === "finished")) {
        const e = new Error("Not all games in the current round are finished yet"); e.status = 400; throw e;
    }

    // Collect winners; include the player who skipped this round
    const winners = roundGames.map(g => g.winnerId);
    if (currentRound.byeUserId) winners.push(currentRound.byeUserId);

    // Only one player left - ready to finalise with PATCH /tournaments/:tournamentId/winner
    if (winners.length === 1) {
        const e = new Error(`One player remains (userId: ${winners[0]}) - use PATCH /tournaments/${tournamentId}/winner to finalise`);
        e.status = 400; throw e;
    }

    return createRound(tournament, winners, tournament.currentRound + 1);
}

// records the winner and pushes the tournament trophy onto their profile
export async function awardWinner(tournamentId, winnerId) {
    const tournament = await Tournament.findOne({ tournamentId: tournamentId });
    if (!tournament) { const e = new Error("Tournament not found"); e.status = 404; throw e; }

    const user = await User.findOne({ userId: winnerId }).select("-pwd");
    if (!user) { const e = new Error("Winner user not found"); e.status = 404; throw e; }

    // push the trophy onto the winner's profile
    await User.findOneAndUpdate(
        { userId: winnerId },
        { $push: { trophies: { title: tournament.trophy.title, imageUrl: tournament.trophy.imageUrl, tournamentId: tournamentId } } }
    );

    // mark tournament as finished with winnerId recorded
    return Tournament.findOneAndUpdate(
        { tournamentId: tournamentId },
        { status: "finished", winnerId: winnerId },
        { returnDocument: "after" }
    );
}

export default {
    getAllTournaments,
    getTournamentById,
    getTournamentComments,
    createTournament,
    createTournamentComment,
    joinTournament,
    updateTournament,
    deleteTournament,
    startTournament,
    advanceTournament,
    awardWinner,
    leaveTournament,
    getStandings,
    getTournamentGames
};
