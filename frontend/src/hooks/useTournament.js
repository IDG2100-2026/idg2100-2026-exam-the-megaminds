import {useCallback, useEffect, useState} from "react";
import {tournamentService} from "@/services/api";

export function useTournament(tournamentId) {
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);

    const refresh = useCallback(() => setReloadKey(k => k + 1), []);

    useEffect(() => {
    if (!tournamentId) return;
    let cancelled = false;

    tournamentService.getTournament(tournamentId)
        .then(res => { if (!cancelled) setTournament(res.data ?? null); })
        .catch(err => { if (!cancelled) setError(err.message); })
        .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
    }, [tournamentId, reloadKey]);

    return {tournament, loading, error, refresh};

}