import { useState, useEffect } from "react";
import { userService } from "@/services/api";

// Module-level cache so the same user isn't re-fetched on every render/mount.
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
