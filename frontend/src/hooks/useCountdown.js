import { useEffect, useState } from "react";

function getRemaining(target) {
    const diff = new Date(target).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        isExpired: false,
    };
}

export function useCountdown(targetDate) {
    const [remaining, setRemaining] = useState(() => getRemaining(targetDate));

    useEffect(() => {
        const id = setInterval(() => setRemaining(getRemaining(targetDate)), 1000);
        return () => clearInterval(id);
    }, [targetDate]);

    return remaining;
}
