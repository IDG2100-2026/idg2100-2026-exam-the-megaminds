import { WebSocketServer } from "ws";
import { consumeWsToken } from "../middleware/jwt.js";
import { ensureEngine, rollDice, doneRolling, getState } from "../services/gameEngine.service.js";


// gameId -> Set of sockets in that game
const rooms = new Map();

const tournamentRooms = new Map();

export function broadcastToGame(gameId, message) {
    rooms.get(gameId)?.forEach(socket => {
        socket.send(JSON.stringify(message));
    });
}

export function broadcastToTournament(tournamentId, message){
    tournamentRooms.get(tournamentId)?.forEach(socket => {
        socket.send(JSON.stringify(message));
    });
}

function broadcastState(gameId) {
    rooms.get(gameId)?.forEach(socket => {
        socket.send(JSON.stringify({type: "state", state: getState(gameId, socket.userId) }));
    });
}
export function initGameSocket(server) {
    const wss = new WebSocketServer({ server });

    wss.on("connection", (socket) => {
        socket.authenticated = false;

        socket.on("message", async (data) => {
            const msg = JSON.parse(data);

            // Step 1 - auth must happen first
            if (msg.type === "auth") {
                const userId = consumeWsToken(msg.wsToken);
                if (!userId) {
                    socket.send(JSON.stringify({ type: "auth-failed"}));
                    socket.close();
                    return;
                }
                socket.userId = userId;
                socket.authenticated = true;
                socket.send(JSON.stringify({type : "auth-success" }));
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
                socket.send(JSON.stringify({ type: "state", state: getState(gameId, socket.userId) }));
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
                return;
            }

        });

        socket.on("close", () => {
            // Remove socket from its room on dosconnect
            if (socket.gameId) {
                rooms.get(socket.gameId)?.delete(socket);
                if (rooms.get(socket.gameId)?.size === 0){
                    rooms.delete(socket.gameId);
                }
            }
            if (socket.tournamentId){
                tournamentRooms.get(socket.tournamentId)?.delete(socket);
                if (tournamentRooms.get(socket.tournamentId)?.size === 0){
                    tournamentRooms.delete(socket.tournamentId);
                }
            }
        });
    });
}