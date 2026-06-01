import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { tournamentService } from "@/services/api";
import { useUserName } from "@/hooks/useUsername";
import styles from "./OngoingGames.module.css";

export default function OngoingGames({ tournament }) {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        tournamentService.getGames(tournament.tournamentId)
            .then(res => { if (!cancelled) setGames(res.data ?? []); })
            .catch(err => { if (!cancelled) setError(err.message); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [tournament.tournamentId]);

    // Only the current round's games are "ongoing"
    const currentRound = tournament.rounds?.find(r => r.roundNumber === tournament.currentRound);
    const roundGameIds = currentRound?.games ?? [];
    const roundGames = games.filter(g => roundGameIds.includes(g.gameId));

    if (loading) return <p className={styles.ongoing__empty}>Loading games…</p>;
    if (error) return <p className={styles.ongoing__empty}>Error: {error}</p>;
    if (roundGames.length === 0) return <p className={styles.ongoing__empty}>No games in progress right now.</p>;

    return (
        <div className={styles.ongoing}>
            <ul className={styles.ongoing__list}>
                {roundGames.map(game => (
                    <OngoingGameRow key={game.gameId} game={game} />
                ))}
            </ul>
        </div>
    );
}

function OngoingGameRow({ game }) {
    const [p1, p2] = game.players ?? [];
    const name1 = useUserName(p1?.userId);
    const name2 = useUserName(p2?.userId);
    const live = game.status === "in-progress";

    return (
        <li>
            <Link to={`/game/${game.gameId}`} className={styles.ongoing__game}>
                <span className={styles.ongoing__players}>
                    {name1}<span className={styles.ongoing__vs}>vs</span>{name2}
                </span>
                <div className={styles.ongoing__right}>
                    <span className={`${styles.ongoing__status} ${live ? styles["ongoing__status--live"] : styles["ongoing__status--pending"]}`}>
                        {live ? "Live" : game.status}
                    </span>
                    <span className={styles.ongoing__spectate}>Spectate →</span>
                </div>
            </Link>
        </li>
    );
}
