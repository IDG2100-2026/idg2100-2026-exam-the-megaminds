import { WebSocketServer } from "ws";
import { consumeWsToken } from "../middleware/jwt.js";
import { ensureEngine, rollDice, doneRolling, revealRound, startRound, getEngine, removeEngine, getState, placeBet, foldBet, leaveGame } from "../services/gameEngine.service.js";
import { recordGameResult, getGameById, refundPoints, revertGameToPending } from "../services/games.service.js";
import { advanceTournament } from "../services/tournaments.service.js";


// gameId -> Set of sockets in that game
const rooms = new Map();

const tournamentRooms = new Map();

export function broadcastToGame(gameId, message) {
    rooms.get(gameId)?.forEach(socket => {
        socket.send(JSON.stringify(message));
    });
}

export function broadcastToTournament(tournamentId, message) {
    tournamentRooms.get(tournamentId)?.forEach(socket => {
        socket.send(JSON.stringify(message));
    });
}

function broadcastState(gameId) {
    rooms.get(gameId)?.forEach(socket => {
        socket.send(JSON.stringify({ type: "state", state: getState(gameId, socket.userId) }));
    });
}
export function initGameSocket(server) {
    const wss = new WebSocketServer({ server });

    async function handleReveal(gameId) {
        const reveal = revealRound(gameId);
        if (reveal.error) return;
        broadcastState(gameId);
        broadcastToGame(gameId, {
            type: "round-result",
            winnerIds: reveal.winnerIds,
            handNames: reveal.handNames,
            scores: reveal.scores,
            isGameOver: reveal.isGameOver
        });

        if (reveal.isGameOver) {
            const engine = getEngine(gameId);
            const players = engine
                ? engine.players.map(p => ({ userId: p.userId, score: p.score, stack: p.stack }))
                : reveal.scores;
            const roundTime = engine?.rules?.roundTime;

            recordGameResult(gameId, { players, roundTime, winnerId: reveal.gameWinnerIds?.[0] })
                .catch(err => console.error('Settlement failed:', err));

            removeEngine(gameId);

            try {
                const finishedGame = await getGameById(gameId);
                if (finishedGame?.tournamentId) {
                    const updated = await advanceTournament(finishedGame.tournamentId).catch(() => null);
                    if (updated) {
                        broadcastToTournament(finishedGame.tournamentId, { type: 'round-change', currentRound: updated.currentRound });
                    }
                }
            } catch { /* not all tournament games are finished */ }

            setTimeout(() => broadcastToGame(gameId, {
                type: "game-over",
                winnerIds: reveal.gameWinnerIds,
                scores: reveal.scores
            }), 3000);
        } else {
            setTimeout(() => {
                const engine = getEngine(gameId);
                if (!engine) return;
                startRound(engine);
                broadcastState(gameId);
            }, 3000);
        }
    }

    wss.on("connection", (socket) => {
        socket.authenticated = false;

        socket.on("message", async (data) => {
            const msg = JSON.parse(data);

            // Step 1 - auth must happen first
            if (msg.type === "auth") {
                const userId = consumeWsToken(msg.wsToken);
                if (!userId) {
                    socket.send(JSON.stringify({ type: "auth-failed" }));
                    socket.close();
                    return;
                }
                socket.userId = userId;
                socket.authenticated = true;
                socket.send(JSON.stringify({ type: "auth-success" }));
                return;
            }

            // Ignore everything from unauthenticated sockets
            if (!socket.authenticated) return;

            // Step 2 - join a game room
            if (msg.type === "join-game") {
                const { gameId } = msg;
                if (!rooms.has(gameId)) rooms.set(gameId, new Set());
                rooms.get(gameId).add(socket);
                socket.gameId = gameId;
                socket.send(JSON.stringify({ type: "joined-game", gameId }));

                await ensureEngine(gameId);
                const engine = getEngine(gameId);
                if (engine?.status === 'waiting') {
                    const game = await getGameById(gameId);
                    if (game?.status === 'in-progress') {
                        removeEngine(gameId);
                        await ensureEngine(gameId);
                    }
                }
                broadcastState(gameId);

            }

            if (msg.type === "join-tournament") {
                const { tournamentId } = msg;
                if (!tournamentRooms.has(tournamentId)) tournamentRooms.set(tournamentId, new Set());
                tournamentRooms.get(tournamentId).add(socket);
                socket.tournamentId = tournamentId;
                socket.send(JSON.stringify({ type: "joined-tournament", tournamentId }));
            }

            if (msg.type === "roll") {
                const result = rollDice(socket.gameId, socket.userId, msg.held ?? []);
                if (result.error) return socket.send(JSON.stringify({ type: "error", message: result.error }));
                broadcastState(socket.gameId);   // owner sees real faces, others stay hidden
                return;
            }

            if (msg.type === "done-rolling") {
                const result = doneRolling(socket.gameId, socket.userId);
                if (result.error) return socket.send(JSON.stringify({ type: "error", message: result.error }));
                broadcastState(socket.gameId);

                if (result.roundComplete) {
                    broadcastState(socket.gameId);
                }
                return;
            }

            if (msg.type === "bet") {
                const result = placeBet(socket.gameId, socket.userId, msg.amount ?? 0);
                if (result.error) return socket.send(JSON.stringify({ type: "error", message: result.error }));
                broadcastState(socket.gameId);
                if (result.bettingComplete) {
                    await handleReveal(socket.gameId);
                }
                return;
            }

            if (msg.type === "fold") {
                const result = foldBet(socket.gameId, socket.userId);
                if (result.error) return socket.send(JSON.stringify({ type: "error", message: result.error }));
                broadcastState(socket.gameId);
                if (result.bettingComplete) {
                    await handleReveal(socket.gameId);
                }
                return;
            }

            if (msg.type === "leave-game") {
                const result = leaveGame(socket.gameId, socket.userId);
                if (result.error) return socket.send(JSON.stringify({ type: "error", message: result.error }));

                if (result.refund > 0) {
                    refundPoints(result.leaverId, result.refund).catch(err => console.error("Refund failed:", err));
                }

                if (result.outcome === "revert") {
                    await revertGameToPending(socket.gameId, result.leaverId).catch(err => console.error(err));
                    removeEngine(socket.gameId);
                    await ensureEngine(socket.gameId);   // rebuild a fresh "waiting" engine for the players left behind
                    broadcastState(socket.gameId);
                    return;
                }

                broadcastState(socket.gameId);

                if (result.outcome === "game-over") {
                    const roundTime = getEngine(socket.gameId)?.rules?.roundTime;
                    recordGameResult(socket.gameId, { players: result.players, roundTime, winnerId: result.winnerId })
                        .catch(err => console.error("Settlement failed:", err));
                    removeEngine(socket.gameId);
                    try {
                        const finishedGame = await getGameById(socket.gameId);
                        if (finishedGame?.tournamentId) {
                            const updated = await advanceTournament(finishedGame.tournamentId).catch(() => null);
                            if (updated) broadcastToTournament(finishedGame.tournamentId, { type: "round-change", currentRound: updated.currentRound });
                        }
                    } catch { /* not all tournament games finished */ }
                    broadcastToGame(socket.gameId, {
                        type: "game-over",
                        winnerIds: result.gameWinnerIds,
                        scores: result.players.map(p => ({ userId: p.userId, score: p.score }))
                    });
                } else if (result.outcome === "continue" && result.bettingComplete) {
                    await handleReveal(socket.gameId);
                }
                return;
            }

            if (msg.type === 'comment-added') {
                broadcastToGame(socket.gameId, { type: 'comment-added' });
                return;
            }

        });

        socket.on("close", () => {
            // Remove socket from its room on dosconnect
            if (socket.gameId) {
                rooms.get(socket.gameId)?.delete(socket);
                if (rooms.get(socket.gameId)?.size === 0) {
                    rooms.delete(socket.gameId);
                }
            }
            if (socket.tournamentId) {
                tournamentRooms.get(socket.tournamentId)?.delete(socket);
                if (tournamentRooms.get(socket.tournamentId)?.size === 0) {
                    tournamentRooms.delete(socket.tournamentId);
                }
            }
        });
    });
}