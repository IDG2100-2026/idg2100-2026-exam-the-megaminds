import { useState, useEffect } from "react";
import { tournamentService } from "@/services/api";
import { useUserName } from "@/hooks/useUsername";
import styles from "./TournamentStandings.module.css";

export default function TournamentStandings({ tournamentId }) {
    const [standings, setStandings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        let cancelled = false;
        tournamentService.getStandings(tournamentId)
            .then(res => { if (!cancelled) setStandings(res.data ?? []); })
            .catch(err => { if (!cancelled) setError(err.message); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [tournamentId]);

    if (loading) return <p className={styles.standings__status}>Loading standings…</p>;
    if (error) return <p className={styles.standings__status}>Error: {error}</p>;
    if (standings.length === 0) return <p className={styles.standings__status}>No standings yet.</p>;

    return (
        <table className={styles.standings}>
            <thead>
                <tr>
                    <th className={styles.standings__rank}>#</th>
                    <th>Player</th>
                    <th>Rounds Won</th>
                    <th>Match Wins</th>
                </tr>
            </thead>
            <tbody>
                {standings.map((row, index) => (
                    <StandingRow key={row.userId} rank={index + 1} row={row} />
                ))}
            </tbody>
        </table>
    );
}

function StandingRow({ rank, row }) {
    const name = useUserName(row.userId);
    return (
        <tr>
            <td className={styles.standings__rank}>{rank}</td>
            <td className={styles.standings__player}>{name}</td>
            <td className={styles.standings__points}>{row.points}</td>
            <td>{row.wins}</td>
        </tr>
    );
}
