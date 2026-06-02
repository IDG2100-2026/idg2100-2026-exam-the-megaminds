import { useEffect, useState } from "react";
import { tournamentService, userService, gameService } from "@/services/api";
import styles from "./AwardWinner.module.css";

export default function AwardWinner({ tournament, onChange }) {
    const { tournamentId, rounds = [] } = tournament;
    const [finalists, setFinalists] = useState([]);
    const [winnerId, setWinnerId] = useState("");
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const lastRound = rounds[rounds.length - 1];
        if (!lastRound) { setFinalists([]); return; }

        Promise.all(
            lastRound.games.map(gid => gameService.getGame(gid).then(r => r.data).catch(() => null))
        ).then(async (games) => {
            const ids = games.filter(Boolean).map(g => g.winnerId).filter(Boolean);
            if (lastRound.byeUserId) ids.push(lastRound.byeUserId);
            const users = await Promise.all(
                [...new Set(ids)].map(id => userService.getUser(id).catch(() => null))
            );
            if (!cancelled) setFinalists(users.filter(Boolean));
        });

        return () => { cancelled = true; };
    }, [rounds]);

    async function handleAward() {
        if (!winnerId) return;
        setError(null);
        try {
            await tournamentService.awardWinner(tournamentId, Number(winnerId));
            onChange?.();
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div className={styles.award}>
            <span className={styles.award__label}>Award winner</span>
            <div className={styles.award__row}>
                <select value={winnerId} onChange={e => setWinnerId(e.target.value)}>
                    <option value="">Select winner…</option>
                    {finalists.map(p => (
                        <option key={p.userId} value={p.userId}>{p.username}</option>
                    ))}
                </select>
                <button onClick={handleAward} disabled={!winnerId}>Award</button>
            </div>
            {finalists.length === 0 && (
                <p className={styles.award__hint}>Winners appear once the final round's games are finished.</p>
            )}
            {error && <p className={styles.award__error}>{error}</p>}
        </div>
    );
}
