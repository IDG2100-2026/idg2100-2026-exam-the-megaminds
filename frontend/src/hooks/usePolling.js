import { useState, useEffect, useRef } from "react";

// Auto-refresh data by calling asyncFunction every interval ms
// Useful for live data like game status, comments, etc.
export const usePolling = (asyncFunction, interval = 15000) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const intervalRef = useRef(null);
    const isMountedRef = useRef(true);

    // Track if component is still mounted to avoid state updates after unmount
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

        // Fetch immediately on mount
        fetchData();

        // Then set up polling at the interval
        intervalRef.current = setInterval(fetchData, interval);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [asyncFunction, interval]);

    return { data, loading, error };
};