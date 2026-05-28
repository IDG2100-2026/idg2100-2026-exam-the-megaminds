import { getGameById } from "./games.service.js";

const engines = new Map();

const FRESH_DICE = () => [null, null, null, null, null];

function freshPlayer(p) {
    return {
        userId: p.userId,
        username: p.username ?? "Player",
        faces: FRESH_DICE(),   // server secret; null = not rolled
        held: [false, false, false, false, false],
        rollsLeft: 3,
        score: 0,              
        stack: 0,              
        folded: false,
        connected: true
    };
}

export async function ensureEngine(gameId) {
    if (engines.has(gameId)) return engines.get(gameId);

    const game = await getGameById(gameId);
    if (!game) return null;

    const engine = {
        gameId,
        rules: game.rules,
        status: game.status === "finished" ? "finished" : "waiting",
        currentRound: 1,
        phase: "rolling",      // rolling -> betting -> reveal (later steps)
        players: game.players.map(freshPlayer),
        pot: 0,
        highestBet: 0,
        toAct: null,
        revealed: false
    };
    engines.set(gameId, engine);
    return engine;
    
}

export function getEngine(gameId) {
    return engines.get(gameId) ?? null;
}

export function removeEngine(gameId){
    engines.delete(gameId);
}

export function getState(gameId, viewerId) {
    const e = engines.get(gameId);
    if (!e) return null;

    return {
        gameId: e.gameId,
        rules: e.rules,
        status: e.status,
        currentRound: e.currentRound,
        phase: e.phase,
        pot: e.pot,
        highestBet: e.highestBet,
        toAct: e.toAct,
        revealed: e.revealed,
        players: e.players.map(p => {
            const show = e.revealed || p.userId === viewerId;
            return {
                userId: p.userId,
                username: p.username,
                score: p.score,
                stack: p.stack,
                folded: p.folded,
                rollsLeft: p.rollsLeft,
                connected: p.connected,
                hasRolled: p.faces.some(f => f !== null),
                faces: show ? p.faces : p.faces.map(() => null)
            };
        })
    };
}

export default { ensureEngine, getEngine, removeEngine, getState};