import { getGameById } from "./games.service.js";
import { decideRound } from "./handEval.service.js";

const engines = new Map();

const FRESH_DICE = () => [null, null, null, null, null];
const DICE_FACES = ["A", "K", "Q", "J", "8", "7"];
const rollFace = () => DICE_FACES[Math.floor(Math.random() * DICE_FACES.length)];

function freshPlayer(p, buyIn = 0) {
    return {
        userId: p.userId,
        username: p.username ?? "Player",
        faces: FRESH_DICE(),
        held: [false, false, false, false, false],
        rollsLeft: 3,
        score: 0,
        stack: buyIn,
        currentBet: 0,
        folded: false,
        left: false,
        done: false,
        connected: true
    };
}

export async function ensureEngine(gameId) {
    if (engines.has(gameId)) return engines.get(gameId);

    const game = await getGameById(gameId);
    if (!game) return null;
    const buyIn = game.rules?.buyIn ?? 0;

    const engine = {
        gameId,
        rules: game.rules,
        status: game.status === "finished" ? "finished" : "waiting",
        currentRound: 1,
        phase: "rolling",
        players: game.players.map(p => freshPlayer(p, buyIn)),
        pot: 0,
        highestBet: 0,
        bettingQueue: [],
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
    engine.pot = 0;
    engine.highestBet = 0;
    engine.bettingQueue = [];
    engine.players.forEach(p => {
        if (p.left) return;
        p.faces = [null, null, null, null, null];
        p.held = [false, false, false, false, false];
        p.rollsLeft = 3;
        p.done = false;
        p.folded = false;
        p.currentBet = 0;
    });
    engine.toAct = engine.players.find(p => !p.left)?.userId ?? null;
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

    const next = e.players.find(p => !p.done && !p.left);
    if (next) {
        e.toAct = next.userId;
        return { roundComplete: false };
    }
    e.toAct = null;
    e.phase = "betting";
    e.highestBet = 0;
    e.bettingQueue = e.players.filter(p => !p.folded && !p.left).map(p => p.userId);
    e.toAct = e.bettingQueue[0] ?? null;
    return { roundComplete: true };
}

function advanceBetting(engine) {
    const active = engine.players.filter(p => !p.folded);
    if (active.length <= 1) {
        if (active.length === 1) { active[0].stack += engine.pot; engine.pot = 0; }
        engine.phase = "reveal";
        engine.toAct = null;
        return { bettingComplete: true };
    }
    if (engine.bettingQueue.length === 0) {
        engine.phase = "reveal";
        engine.toAct = null;
        return { bettingComplete: true };
    }
    engine.toAct = engine.bettingQueue[0];
    return { bettingComplete: false };
}

export function placeBet(gameId, userId, amount) {
    const e = engines.get(gameId);
    if (!e) return { error: "Game not found" };
    if (e.phase !== "betting") return { error: "Not the betting phase" };
    if (e.toAct !== userId) return { error: "Not your turn" };
    const player = e.players.find(p => p.userId === userId);
    if (!player || player.folded) return { error: "Not in this game" };
    const toCall = e.highestBet - player.currentBet;
    if (amount < toCall) return { error: `Must bet at least ${toCall}` };
    if (amount > player.stack) return { error: "Not enough points in stack" };
    const isRaise = amount > toCall;
    player.stack -= amount;
    e.pot += amount;
    player.currentBet += amount;
    if (player.currentBet > e.highestBet) e.highestBet = player.currentBet;
    e.bettingQueue.shift();
    if(isRaise) {
        const others = e.players
            .filter(p => !p.folded && p.userId !== userId)
            .map(p => p.userId)
            .filter(uid => !e.bettingQueue.includes(uid));
        e.bettingQueue.push(...others);
    }
    e.bettingQueue = e.bettingQueue.filter(uid => !e.players.find(p => p.userId === uid)?.folded);
    return advanceBetting(e);
}

export function foldBet(gameId, userId) {
    const e = engines.get(gameId);
    if (!e) return { error: "Game not found" };
    if (e.phase !== "betting") return { error: "Not the betting Phase" };
    if (e.toAct !== userId) return { error: "Not your turn" };
    const player = e.players.find(p => p.userId === userId);
    if (!player) return { error: "Not on this game" };
    player.folded = true;
    e.bettingQueue.shift();
    e.bettingQueue = e.bettingQueue.filter(uid => uid !== userId);
    return advanceBetting(e);
}

export function leaveGame(gameId, userId){
    const e = engines.get(gameId);
    if (!e) return { error: "Game not found"};
    const player = e.players.find(p => p.userId === userId);
    if (!player) return { error: "You are not in this game"};

    const buyIn = e.rules?.buyIn ?? 0;

    if (e.currentRound === 1 && e.pot === 0) {
        player.left = true;
        return { outcome: "revert", leaverId: userId, refund: buyIn};
    }

    const refund = 0;
    player.stack = 0;
    player.left = true;
    player.folded = true;
    player.done = true;
    player.connected = false;
    e.bettingQueue = (e.bettingQueue ?? []).filter(uid => uid !== userId);

    const remaining = e.players.filter(p => !p.left);

    if (remaining.length <= 1){
        const winner = remaining[0];
        if (winner) winner.stack += e.pot;
         e.pot = 0;
        e.phase = "finished";
        e.status = "finished";
        e.toAct = null;
        e.gameWinnerIds = winner ? [winner.userId] : [];
        return {
            outcome: "game-over",
            leaverId: userId,
            refund,
            winnerId: winner?.userId,
            gameWinnerIds: e.gameWinnerIds,
            players: e.players.map(p => ({ userId: p.userId, score: p.score, stack: p.stack }))
        };
    }

    let bettingComplete = false;
    if (e.toAct === userId){
        if (e.phase === "betting"){
            bettingComplete = advanceBetting(e).bettingComplete;
        } else if (e.phase === "rolling") {
            const next = e.players.find(p => !p.done && !p.folded);
            if (next){
                e.toAct = next.userId;
            } else{
                e.phase = "betting";
                e.highestBet = 0;
                e.bettingQueue = e.players.filter(p => !p.folded).map(p => p.userId);
                e.toAct = e.bettingQueue[0] ?? null;
            }
        }
    }
    return { outcome: "continue", leaverId: userId, refund, bettingComplete };
}

export function revealRound(gameId) {
    const e = engines.get(gameId);
    if (!e) return { error: "Game not found" };
    if (e.phase !== "reveal") return { error: "Not the reveal phase" };

    e.revealed = true;

    const active = e.players.filter(p => !p.folded && p.faces.some(f => f !== null));
    const { hands, winnerIds } = decideRound(active, e.rules.straightallowed ?? false);

    const handNames = {};
    hands.forEach(h => { handNames[h.userId] = h.name; });

    winnerIds.forEach(uid => {
        const p = e.players.find(p => p.userId === uid);
        if (p) p.score += 1;
    });

    const share = Math.floor(e.pot / winnerIds.length);
    winnerIds.forEach((uid, i) => {
        const p = e.players.find(p => p.userId === uid);
        if (p) p.stack += share + (i === 0 ? e.pot % winnerIds.length : 0);
    });
    e.pot = 0;

    const winThreshold = Math.floor(e.rules.bestof / 2) + 1;
    const isGameOver = e.players.some(p => p.score >= winThreshold) || e.currentRound >= e.rules.bestof;

    if (isGameOver) {
        e.phase = "finished";

        const pool = e.players.filter(p => !p.left);
        const contenders = pool.length ? pool : e.players;
        const maxScore = Math.max(...contenders.map(p => p.score));
        const topByScore = contenders.filter(p => p.score === maxScore);

        const maxStack = Math.max(...topByScore.map(p => p.stack));
        const winner = topByScore.find(p => p.stack === maxStack);
        e.gameWinnerIds = winner ? [winner.userId] : [];
    } else {
        e.currentRound += 1;
    }

    return {
        isGameOver,
        winnerIds,
        handNames,
        gameWinnerIds: e.gameWinnerIds ?? [],
        scores: e.players.map(p => ({ userId: p.userId, score: p.score }))
    };

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
                currentBet: p.currentBet,
                done: p.done,
                rollsLeft: p.rollsLeft,
                connected: p.connected,
                hasRolled: p.faces.some(f => f !== null),
                faces: show ? p.faces : p.faces.map(() => null)
            };
        })
    };
}

export default { ensureEngine, startRound, rollDice, doneRolling, revealRound, placeBet, foldBet, getEngine, removeEngine, getState, leaveGame };
