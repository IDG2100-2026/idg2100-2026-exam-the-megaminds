/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";
import { useTournamentSocket } from "@/hooks/useTournamentSocket";

const TournamentSocketContext = createContext(null);

// Opens ONE tournament WebSocket for everything rendered inside it (the detail page
// and its comments), so a tournament page holds a single connection instead of one
// per component. Children read it via useTournamentSocketContext().
export function TournamentSocketProvider({ tournamentId, children }) {
    const socket = useTournamentSocket(tournamentId);
    return (
        <TournamentSocketContext.Provider value={socket}>
            {children}
        </TournamentSocketContext.Provider>
    );
}

// Consume the shared connection. Throws if used outside the provider, so the mistake
// surfaces loudly instead of silently opening no socket.
export function useTournamentSocketContext() {
    const ctx = useContext(TournamentSocketContext);
    if (ctx === null) {
        throw new Error("useTournamentSocketContext must be used inside a TournamentSocketProvider");
    }
    return ctx;
}
