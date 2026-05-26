import User from "../models/users.js";
import { createGame } from "./games.service.js";

// in-memory queue — each entry: { userId, elo, rules, joinedAt }
const queue = [];

// separate queue for anonymous users — no ELO, matched first-come first-served
const anonQueue = [];

// ELO tolerance grows the longer a player waits with no match
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

    // find the best waiting opponent whose current tolerance covers the ELO gap
    const matchIndex = queue.findIndex(e => Math.abs(e.elo - user.elo) <= calculateTolerance(e.joinedAt));

    if (matchIndex !== -1) {
        // pull them out of the queue and create a game immediately
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

    // no match yet — park in queue
    queue.push({ userId: user.userId, elo: user.elo, rules: rules || null, joinedAt: new Date() });
    return { matched: false, position: queue.length };
}

export function leaveQueue(userId) {
    const index = queue.findIndex(e => e.userId === userId);
    if (index === -1) { const e = new Error("User is not in the queue"); e.status = 404; throw e; }
    queue.splice(index, 1);
    return { removed: true };
}

// anonymous users are matched purely on availability — no ELO involved
export async function joinAnonQueue(rules) {
    if (anonQueue.length > 0) {
        const [opponent] = anonQueue.splice(0, 1);
        const gameRules = rules || opponent.rules || { bestof: 3, straightallowed: true, roundTime: 10 };
        const gameId = `anon-${Date.now()}`;
        const game = await createGame({
            gameId,
            rules: gameRules,
            players: [], //anonymous users have no userId, so this is always empty
            status: "pending"
        });
        return { matched: true, game };
    }
    anonQueue.push({ rules: rules || null, joinedAt: new Date() });
    return { matched: false, position: anonQueue.length };
}

// return queue with live tolerance so the admin view shows how relaxed each player is
export function getQueue() {
    return queue.map(e => ({
        ...e,
        waitSeconds: Math.floor((Date.now() - new Date(e.joinedAt).getTime()) / 1000),
        toleranceElo: calculateTolerance(e.joinedAt)
    }));
}

export default { joinQueue, joinAnonQueue, leaveQueue, getQueue };
