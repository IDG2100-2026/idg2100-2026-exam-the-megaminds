import { User } from "../models/users.js";

export function calculateElo(winnerElo, loserElo) {
    const K = 32;
    const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
    const expectedLoser = 1 - expectedWinner;
    return {
        newWinnerElo: Math.round(winnerElo + K * (1 - expectedWinner)),
        newLoserElo: Math.round(loserElo + K * (0 - expectedLoser))
    };
}

function eloFieldForTime(roundTime) {
    if (roundTime === 10) return "eloBullet";
    if (roundTime === 30) return "eloBlitz";
    return "eloRapid";
}

export async function updateElo(players, roundTime) {
    const eloField = eloFieldForTime(roundTime);

    const userIds = players.map(p => p.userId);
    const userDocs = await User.find({ userId: { $in: userIds } })
        .select(`userId elo ${eloField} wins losses totalGames winPercentage eloChangeLastWeek eloWeekStart winsLastMonth lossesLastMonth lastMonthReset`);

    const byId = Object.fromEntries(userDocs.map(u => [u.userId, u]));

    const deltas = Object.fromEntries(userIds.map(id => [id, 0]));
    const wonPairwise = Object.fromEntries(userIds.map(id => [id, 0]));
    const lostPairwise = Object.fromEntries(userIds.map(id => [id, 0]));

    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            const a = players[i];
            const b = players[j];
            const userA = byId[a.userId];
            const userB = byId[b.userId];
            if (!userA || !userB) continue;

            const aElo = userA[eloField] ?? userA.elo ?? 1000;
            const bElo = userB[eloField] ?? userB.elo ?? 1000;

            if (a.score > b.score) {
                const { newWinnerElo, newLoserElo } = calculateElo(aElo, bElo);
                deltas[a.userId] += newWinnerElo - aElo;
                deltas[b.userId] += newLoserElo - bElo;
                wonPairwise[a.userId]++;
                lostPairwise[b.userId]++;
            } else if (b.score > a.score) {
                const { newWinnerElo, newLoserElo } = calculateElo(bElo, aElo);
                deltas[b.userId] += newWinnerElo - bElo;
                deltas[a.userId] += newLoserElo - aElo;
                wonPairwise[b.userId]++;
                lostPairwise[a.userId]++;
            }

        }
    }

    const maxScore = Math.max(...players.map(p => p.score));
    const winnerId = players.find(p => p.score === maxScore)?.userId;

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    for (const { userId } of players) {
        const u = byId[userId];
        if (!u) continue;

        const delta = deltas[userId];
        const currentElo = u[eloField] ?? u.elo ?? 1000;
        const newElo = Math.max(0, currentElo + delta);

        const newGenericElo = Math.max(0, (u.elo ?? 1000) + delta);

        const weekExpired = !u.eloWeekStart || u.eloWeekStart < oneWeekAgo;
        const monthExpired = !u.lastMonthReset || u.lastMonthReset < oneMonthAgo;

        const isWinner = userId === winnerId;
        const newWins = u.wins + (isWinner ? 1 : 0);
        const newLosses = u.losses + (isWinner ? 0 : 1);
        const newTotal = u.totalGames + 1;

        const newWinsLastMonth = monthExpired ? (isWinner ? 1 : 0) : u.winsLastMonth + (isWinner ? 1 : 0);
        const newLossesLastMonth = monthExpired ? (isWinner ? 0 : 1) : u.lossesLastMonth + (isWinner ? 0 : 1);

        await User.findOneAndUpdate(
            { userId },
            {
                [eloField]: newElo,
                elo: newGenericElo,
                eloChangeLastWeek: weekExpired ? delta : u.eloChangeLastWeek + delta,
                ...(weekExpired && { eloWeekStart: now }),
                winsLastMonth: newWinsLastMonth,
                lossesLastMonth: newLossesLastMonth,
                ...(monthExpired && { lastMonthReset: now }),
                winPercentage: newTotal > 0 ? newWins / newTotal : 0,
                $inc: {
                    wins: isWinner ? 1 : 0,
                    losses: isWinner ? 0 : 1,
                    totalGames: 1
                }
            }
        );
    }
}

export default { calculateElo, updateElo };
