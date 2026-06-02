import { useState, useEffect } from "react";
import { userService } from "@/services/api";

const cache = new Map();

export function useUserName(userId) {
    const [name, setName] = useState(() => cache.get(userId));

    useEffect(() => {
        if (userId == null) return;
        if (cache.has(userId)) {
            setName(cache.get(userId));
            return;
        }
        let cancelled = false;
        userService.getUser(userId)
            .then(u => {
                cache.set(userId, u.username);
                if (!cancelled) setName(u.username);
            })
            .catch(() => { if (!cancelled) setName(`User ${userId}`); });
        return () => { cancelled = true; };
    }, [userId]);

    return name ?? (userId == null ? "" : `User ${userId}`);
}
