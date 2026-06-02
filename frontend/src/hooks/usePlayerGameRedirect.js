import { useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";
import { tournamentService } from "@/services/api";

export function usePlayerGameRedirect(tournament, user) {
    const navigate = useNavigate();
    const [checking, setChecking] = useState(false);
    const [lobbyOver, setLobbyOver] = useState(false);

    const isParticipant = !!user && tournament?.participants?.includes(user.userId);
    const active = tournament?.status === "in-progress" && isParticipant && lobbyOver;

    useEffect(()=> {
        const t = tournament?.nextRoundStartsAt;
        if (!t) { setLobbyOver(true); return;}
        const ms = new Date(t) - Date.now();
        if (ms <= 0 ) { setLobbyOver(true); return;}
        setLobbyOver(false);
        const id = setTimeout(() => setLobbyOver(true), ms);
        return () => clearTimeout(id);
    }, [tournament?.nextRoundStartsAt]);

    useEffect(() =>{
        if (!active) return;
        let cancelled = false;
        setChecking(true);

        tournamentService.getGames(tournament.tournamentId)
            .then(res => {
                if (cancelled) return;
                const games = res.data ?? [];
                const round = tournament.rounds?.find(r => r. roundNumber === tournament.currentRound);
                const roundGameIds = round?.games ?? [];

                const myGame = games.find(g =>
                    roundGameIds.includes(g.gameId) &&
                    g.status !== "finished" &&
                    g.players?.some(p => p.userId === user.userId)
                );
                if (myGame) navigate(`/game/${myGame.gameId}`);
            })
            .catch(() => { /* stay on the tournament page if the lookup fails */ })
            .finally(() => { if (!cancelled) setChecking(false); });

        return () => { cancelled = true; };
    }, [active, tournament?.tournamentId, tournament?.currentRound, tournament?.rounds, user?.userId, navigate]);

    return {checking, isParticipant, lobbyOver};
}