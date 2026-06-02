import User from "../models/users.js";
import { createGame } from "./games.service.js";

const queue = [];

const anonQueue = [];

export function calculateTolerance(joinedAt) {
    const waitSeconds = (Date.now() - new Date(joinedAt).getTime()) / 1000;
    if (waitSeconds < 30)  return 200;
    if (waitSeconds < 60)  return 400;
    if (waitSeconds < 120) return 700;
    return Infinity;
}

export async function joinQueue(userId, rules) {
    const user = await User.findOne({ userId }).select("userId elo banned");
    if (!user)        { const e = new Error("User not found"); e.status = 404; throw e; }
    if (user.banned)  { const e = new Error("Banned users cannot join the matchmaking queue"); e.status = 403; throw e; }
    if (queue.some(e => e.userId === userId)) { const e = new Error("User is already in the queue"); e.status = 400; throw e; }

    const matchIndex = queue.findIndex(e => Math.abs(e.elo - user.elo) <= calculateTolerance(e.joinedAt));

    if (matchIndex !== -1) {

        const [opponent] = queue.splice(matchIndex, 1);
        const gameRules = rules || opponent.rules || { bestof: 3, straightallowed: true, roundTime: 10 };
        const gameId = `mm-${Date.now()}`;
        const game = await createGame({
            gameId,
            rules: gameRules,
            players: [
                { userId: user.userId, score: 0 },
                { userId: opponent.userId, score: 0 }
            ],
            status: "pending"
        });
        return { matched: true, game };
    }

    queue.push({ userId: user.userId, elo: user.elo, rules: rules || null, joinedAt: new Date() });
    return { matched: false, position: queue.length };
}

export function leaveQueue(userId) {
    const index = queue.findIndex(e => e.userId === userId);
    if (index === -1) { const e = new Error("User is not in the queue"); e.status = 404; throw e; }
    queue.splice(index, 1);
    return { removed: true };
}

export async function joinAnonQueue(rules) {
    if (anonQueue.length > 0) {
        const [opponent] = anonQueue.splice(0, 1);
        const gameRules = rules || opponent.rules || { bestof: 3, straightallowed: true, roundTime: 10 };
        const gameId = `anon-${Date.now()}`;
        const game = await createGame({
            gameId,
            rules: gameRules,
            players: [],
            status: "pending"
        });
        return { matched: true, game };
    }
    anonQueue.push({ rules: rules || null, joinedAt: new Date() });
    return { matched: false, position: anonQueue.length };
}

export function getQueue() {
    return queue.map(e => ({
        ...e,
        waitSeconds: Math.floor((Date.now() - new Date(e.joinedAt).getTime()) / 1000),
        toleranceElo: calculateTolerance(e.joinedAt)
    }));
}

export default { joinQueue, joinAnonQueue, leaveQueue, getQueue };
