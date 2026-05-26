import { User } from "../models/users.js";

// ELO formula based on the standard chess rating system
export function calculateElo(winnerElo, loserElo) {
    // K controls how many points can be won/lost in a single game — 32 is standard
    const K = 32;

    // Expected score = how likely this player was to win based on the ELO gap
    // A player with much higher ELO has an expectedScore close to 1 (almost certain to win)
    const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
    const expectedLoser = 1 - expectedWinner; // the two must always sum to 1

    return {
        // Actual score for winner is 1 (won); gain is smaller if they were already the favourite
        newWinnerElo: Math.round(winnerElo + K * (1 - expectedWinner)),
        // Actual score for loser is 0 (lost); loss is smaller if they were already the underdog
        newLoserElo: Math.round(loserElo + K * (0 - expectedLoser))
    };
}

export async function updateElo(winnerId, loserId) {
    const winner = await User.findOne({ userId: winnerId }).select("userId elo wins totalGames eloChangeLastWeek eloWeekStart winPercentage losses");
    const loser = await User.findOne({ userId: loserId }).select("userId elo wins totalGames eloChangeLastWeek eloWeekStart winPercentage losses");

    const { newWinnerElo, newLoserElo } = calculateElo(winner.elo, loser.elo);

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // How many ELO points each player gains or loses from this game
    const winnerDelta = newWinnerElo - winner.elo;
    const loserDelta = newLoserElo - loser.elo;

    // eloChangeLastWeek tracks how much ELO a player has gained/lost over a rolling 7-day window.
    const winnerWeekExpired = !winner.eloWeekStart || winner.eloWeekStart < oneWeekAgo;
    const loserWeekExpired = !loser.eloWeekStart || loser.eloWeekStart < oneWeekAgo;

    // Pre-calculate new totals to use in winPercentage below
    const winnerNewWins = winner.wins + 1;
    const winnerNewTotal = winner.totalGames + 1;
    const loserNewTotal = loser.totalGames + 1;

    // Update winner: new ELO, weekly change, win percentage, and increment wins + totalGames
    await User.findOneAndUpdate(
        { userId: winnerId },
        {
            elo: newWinnerElo,
            eloChangeLastWeek: winnerWeekExpired ? winnerDelta : winner.eloChangeLastWeek + winnerDelta,
            // If the week expired, reset the window start to now
            ...(winnerWeekExpired && { eloWeekStart: now }),
            winPercentage: winnerNewWins / winnerNewTotal,
            // $inc adds to the existing value rather than overwriting it
            $inc: { wins: 1, totalGames: 1 }
        }
    );

    // Update loser: new ELO, weekly change, win percentage, and increment losses + totalGames
    await User.findOneAndUpdate(
        { userId: loserId },
        {
            elo: newLoserElo,
            eloChangeLastWeek: loserWeekExpired ? loserDelta : loser.eloChangeLastWeek + loserDelta,
            ...(loserWeekExpired && { eloWeekStart: now }),
            // loser.wins stays the same since they didn't win
            winPercentage: loser.wins / loserNewTotal,
            $inc: { losses: 1, totalGames: 1 }
        }
    );
}
export default {
    calculateElo,
    updateElo
};