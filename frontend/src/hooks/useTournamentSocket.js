import { useState, useEffect, useRef, useCallback } from "react";

const WS_URL = import.meta.env.VITE_WS_URL;

export function useTournamentSocket(tournamentId) {
        const wsRef = useRef(null);
    const connectRef = useRef(null);
    const reconnectRef = useRef(null);
    const closingRef = useRef(false);
    const [lastMessage, setLastMessage] = useState(null);
    const [connected, setConnected] = useState(false);

    const connect = useCallback(async () =>{
        if (!tournamentId) return;

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ws-token`, {
            credentials: "include",
        });
        // Not logged in — skip WS entirely (no reconnect loop)
        if (!res.ok) return;
        const { wsToken } = await res.json();

        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => ws.send(JSON.stringify({ type: "auth", wsToken}));

        ws.onmessage = (event) => {
            const msg =JSON.parse(event.data);
            if (msg.type === "auth-success") {
                ws.send(JSON.stringify({ type: "join-tournament", tournamentId}));
            }
            if (msg.type === "joined-tournament") setConnected(true);
            setLastMessage(msg);
        }
        ws.onclose = () => {
            setConnected(false);
            if (closingRef.current) return;
            reconnectRef.current = setTimeout(() => connectRef.current?.(), 3000);
        };
        ws.onerror = () => ws.close();
    }, [tournamentId]);

    useEffect(() => { connectRef.current = connect; }, [connect]);

    useEffect(() => { 
     closingRef.current = false;
     connect();
    
      return () => {
        closingRef.current = true;
        clearTimeout(reconnectRef.current);
        wsRef.current?.close();
      };
    }, [connect]);

    return { lastMessage, connected };
    
}