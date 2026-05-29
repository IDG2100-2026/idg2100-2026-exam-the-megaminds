import { useState, useEffect } from 'react';
import { leaderboardService } from '@/services/api';
import styles from './LeaderboardPage.module.css';

const LIMIT = 20;

export default function LeaderboardPage() {
    const [players, setPlayers] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        leaderboardService.getLeaderboard(page, LIMIT)
            .then(res => {
                const list = Array.isArray(res.data) ? res.data : [];
                setPlayers(prev => page === 1 ? list : [...prev, ...list]);
                setHasMore(list.length === LIMIT);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [page]);

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Leaderboard</h1>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={styles.th}>Rank</th>
                        <th className={styles.th}>Player</th>
                        <th className={styles.th}>Elo</th>
                        <th className={styles.th}>This week</th>
                        <th className={styles.th}>W / L</th>
                        <th className={styles.th}>Win %</th>
                        <th className={styles.th}>Games</th>
                    </tr>
                </thead>
                <tbody>
                    {players.map((player, idx) => {
                        const rankClass = idx === 0 ? styles.gold : idx === 1 ? styles.silver : idx === 2 ? styles.bronze : '';
                        const weekChange = player.eloChangeLastWeek ?? 0;
                        return (
                            <tr key={player.userId} className={styles.row}>
                                <td className={`${styles.td} ${styles.rank} ${rankClass}`}>#{idx + 1}</td>
                                <td className={styles.td}>{player.username}</td>
                                <td className={styles.td}>{player.elo}</td>
                                <td className={`${styles.td} ${weekChange >= 0 ? styles.pos: styles.neg}`}>
                                    {weekChange >= 0 ? '+' : ''}{weekChange}
                                </td>
                                <td className={styles.td}>{player.wins} / {player.losses}</td>
                                <td className={styles.td}>{((player.winPercentage ?? 0) * 100).toFixed(1)}%</td>
                                <td className={styles.td}>{player.totalGames}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {loading && <p className={styles.loading}>Loading...</p>}
            {!loading && hasMore && (
                <button className={styles.loadMoreBtn} onClick={() => { setLoading(true); setPage(p => p + 1); }}>
                    Load more
                </button>
            )}
        </div>
    );
}