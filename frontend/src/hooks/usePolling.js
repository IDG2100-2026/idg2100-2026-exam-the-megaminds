import { useState, useEffect, useRef } from "react";

export const usePolling = (asyncFunction, interval = 15000) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const intervalRef = useRef(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setError(null);
                const result = await asyncFunction();
                if (isMountedRef.current) {
                    setData(result);
                    setLoading(false);
                }
            } catch (err) {
                if (isMountedRef.current) {
                    setError(err.message || 'Polling error');
                    setLoading(false);
                }
            }
        };

        fetchData();

        intervalRef.current = setInterval(fetchData, interval);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [asyncFunction, interval]);

    return { data, loading, error };
};