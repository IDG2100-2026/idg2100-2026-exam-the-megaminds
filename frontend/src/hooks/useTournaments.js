import { useCallback, useEffect, useState } from "react";
import {tournamentService} from "@/services/api";

const DEFAULT_PARAMS = { page: 1, limit: 10, sort: "startDate"};

export function useTournaments(initialParams = {}){
    const [params, setParams] = useState({...DEFAULT_PARAMS, ...initialParams});
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null)
    const [hasMore, setHasMore] = useState(true);

    useEffect(()=> {
        let cancelled = false;
        setLoading(true);
        setError(null);

        tournamentService.getTournaments(params)
            .then(res => {
                if(cancelled) return;
                const list = res.data ?? [];
                setTournaments(prev =>
                    params.page === 1 ? list : [...prev, ...list]
                );
                setHasMore(list.length === params.limit)
            })
            .catch(err => {
                if(!cancelled) setError(err.message);
            })
            .finally(()=> {
                if (!cancelled) setLoading(false);
            });
            return () => {cancelled = true; };
        
    }, [params]);
    const loadMore = useCallback(()=>{
        if (loading || !hasMore) return;
        setParams(prev => ({...prev, page: prev.page +1}));
    }, [loading, hasMore]);

    const updateParams = useCallback((patch)=>{
        setParams(prev => ({...prev, ...patch, page: 1}));
    }, []);
    return { tournaments, loading, error, hasMore, loadMore, updateParams, params };
}