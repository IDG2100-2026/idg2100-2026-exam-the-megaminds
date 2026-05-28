import { getGameById } from "./games.service.js";

const engines = new Map();

const FRESH_DICE = () => [null, null, null, null, null];
const DICE_FACES = ["A", "K", "Q", "J", "8", "7"];   // must match dice-poker-die.js
const rollFace = () => DICE_FACES[Math.floor(Math.random() * DICE_FACES.length)];


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
        done: false,
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
    if (game.status === "in-progress") startRound(engine);
    return engine;
    
}
export function startRound(engine){
    engine.status = "playing";
    engine.phase = "rolling";
    engine.revealed = false;
    engine.players.forEach(p => {
        p.faces = [null, null, null, null, null];
        p.held = [false, false, false, false, false];
        p.rollsLeft = 3;
        p.done = false;
        p.folded = false;
    });
    engine.toAct = engine.players[0]?.userId ?? null;
}

export function rollDice(gameId, userId, heldIndices = []){
    const e = engines.get(gameId);
    if (!e) return { error: "Game Not Found" };
    if (e.phase !== "rolling") return {error: "Not the rolling phase"};
    if (e.toAct !== userId) return {error: "Not your turn"};

    const player = e.players.find(p => p.userId === userId);
    if (!player) return {error: "You are not in this game"};
    if (player.rollsLeft <= 0) return {error: "You are out of rolls"};

    const held = new Set(heldIndices);
    player.faces = player.faces.map((face, i) => (held.has(i) && face !== null ? face : rollFace() ));
    player.held = player.faces.map((_, i) => held.has(i));
    player.rollsLeft -= 1;

    return { faces: player.faces, rollsLeft: player.rollsLeft };
}

export function doneRolling(gameId, userId){
    const e = engines.get(gameId);
    if (!e) return { error: "Game not found" };
    if (e.phase !== "rolling") return { error: "Not the rolling phase" };
    if (e.toAct !== userId) return { error: "It's not your turn" };

    const player = e.players.find(p => p.userId === userId);
    if (!player) return { error: "You are not in this game" };
    if (!player.faces.some(f => f !== null)) return { error: "Roll before finishing your turn" };

    player.done = true;

    const next = e.players.find(p => !p.done);
    if (next) {
        e.toAct = next.userId;
        return { roundComplete: false };
    }
    e.toAct = null;
    e.phase = "reveal";          // step 4 fills in reveal + scoring
    return { roundComplete: true };
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
                done: p.done,
                rollsLeft: p.rollsLeft,
                connected: p.connected,
                hasRolled: p.faces.some(f => f !== null),
                faces: show ? p.faces : p.faces.map(() => null)
            };
        })
    };
}

export default { ensureEngine, startRound, rollDice, doneRolling, getEngine, removeEngine, getState };
