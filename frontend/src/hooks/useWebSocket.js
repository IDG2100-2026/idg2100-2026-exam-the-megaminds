import { useState, useEffect, useRef, useCallback } from "react";
import { flushSync } from "react-dom";

const WS_URL = import.meta.env.VITE_WS_URL;

export function useWebSocket(gameId) {
    const wsRef = useRef(null);
    const connectRef = useRef(null);
    const [lastMessage, setLastMessage] = useState(null);
    const [connected, setConnected] = useState(false);

    const connect = useCallback(async () => {
        // Get a short lived token from the backend
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ws-token`, {
            credentials: "include",
        });
        const { wsToken } = await res.json();

        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            // Authenticate immediately on connect
            ws.send(JSON.stringify({ type: "auth", wsToken}));
        };

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === "auth-success" && gameId) {
                // Join the game room right after auth succeeds
                ws.send(JSON.stringify({ type: "join-game", gameId }));
                setConnected(true);
            }

        flushSync(() => setLastMessage(msg));
        };

        ws.onclose = () => {
            setConnected(false);
            // Auto-reconnect after 3 seconds
            setTimeout(() => connectRef.current?.(), 3000);
        };

        ws.onerror = () => ws.close();

    }, [gameId]);

    useEffect(() => {
        connectRef.current = connect;
    }, [connect]);

    useEffect(() => {
        connect();
        return () => {
            wsRef.current?.close();
        };
    }, [connect]);

    const send = useCallback((message) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        }
    }, []);

    return { lastMessage, connected, send };
}