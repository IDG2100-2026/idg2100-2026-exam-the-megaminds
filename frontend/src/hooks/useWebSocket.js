import { useState, useEffect, useRef, useCallback } from "react";
import { flushSync } from "react-dom";

const WS_URL = import.meta.env.VITE_WS_URL;

export function useWebSocket(gameId) {
    const wsRef = useRef(null);
    const connectRef = useRef(null);
    const [lastMessage, setLastMessage] = useState(null);
    const [connected, setConnected] = useState(false);

    const connect = useCallback(async () => {

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ws-token`, {
            credentials: "include",
        });

        if (!res.ok) return;
        const { wsToken } = await res.json();

        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {

            ws.send(JSON.stringify({ type: "auth", wsToken}));
        };

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === "auth-failed") {
                ws.close();
                return;
            }
            if (msg.type === "auth-success" && gameId) {

                ws.send(JSON.stringify({ type: "join-game", gameId }));
                setConnected(true);
            }

        flushSync(() => setLastMessage(msg));
        };

        ws.onclose = () => {
            setConnected(false);

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