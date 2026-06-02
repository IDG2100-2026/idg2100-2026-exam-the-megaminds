import { createContext, useContext } from "react";
import { useTournamentSocket } from "@/hooks/useTournamentSocket";

const TournamentSocketContext = createContext(null);

export function TournamentSocketProvider({ tournamentId, children }) {
    const socket = useTournamentSocket(tournamentId);
    return (
        <TournamentSocketContext.Provider value={socket}>
            {children}
        </TournamentSocketContext.Provider>
    );
}

export function useTournamentSocketContext() {
    const ctx = useContext(TournamentSocketContext);
    if (ctx === null) {
        throw new Error("useTournamentSocketContext must be used inside a TournamentSocketProvider");
    }
    return ctx;
}
