import { WebSocketServer } from "ws";
import { consumeWsToken } from "../middleware/jwt.js";

// gameId -> Set of sockets in that game
const rooms = new Map();

export function broadcastToGame(gameId, message) {
    rooms.get(gameId)?.forEach(socket => {
        socket.send(JSON.stringify(message));
    });
}

export function initGameSocket(server) {
    const wss = new WebSocketServer({ server });

    wss.on("connection", (socket) => {
        socket.authenticated = false;

        socket.on("message", (data) => {
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
        });
    });
}