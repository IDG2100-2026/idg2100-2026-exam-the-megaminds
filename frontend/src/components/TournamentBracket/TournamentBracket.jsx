import { useState, useEffect } from "react";
import { tournamentService } from "@/services/api";
import {useUserName} from "@/hooks/useUsername";
import styles from "./TournamentBracket.module.css";

export default function TournamentBracket({ tournament }) {
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

    const rounds = tournament.rounds ?? [];

    if (loading) return <p className={styles.bracket__status}>Loading bracket…</p>;
    if (error) return <p className={styles.bracket__status}>Error: {error}</p>;
    if (rounds.length === 0) return <p className={styles.bracket__status}>The bracket appears once the tournament starts.</p>;

    const gameById = new Map(games.map(g => [g.gameId, g]));

    return(
        <div className={styles.bracket}>
            {rounds.map(round => (
                <div key={round.roundNumber} className={styles.bracket__round}>
                    <h3 className={styles.bracket__roundTitle}>Round {round.roundNumber}</h3>
                    <div className={styles.bracket__matches}>
                        {round.games.map(gid => {
                            const game = gameById.get(gid);
                            return game ? <BracketMatch key={gid} game={game} /> : null;
                        })}
                        {round.byeUserId != null && <ByeCard userId={round.byeUserId} />}
                    </div>
                </div>
            ))}

            {tournament.winnerId != null && (
                <div className={styles.bracket__round}>
                    <h3 className={styles.bracket__roundTitle}>Champion</h3>
                    <div className={styles.bracket__matches}>
                        <ChampionCard userId={tournament.winnerId} />
                    </div>
                </div>
            )}
        </div>
    )
}

function BracketMatch({ game }) {
    const [p1, p2] = game.players ?? [];
    const finished = game.status === "finished";
    return (
        <div className={styles.match__wrap}>
            <div className={styles.match}>
                <PlayerRow player={p1} winnerId={game.winnerId} finished={finished} />
                <PlayerRow player={p2} winnerId={game.winnerId} finished={finished} />
            </div>
            {!finished && (
                <span className={styles.match__status}>{game.status === "in-progress" ? "Live" : "Pending"}</span>
            )}
        </div>
    );
}

function PlayerRow({ player, winnerId, finished }) {
    const name = useUserName(player?.userId);
    if (!player) return null;
    const isWinner = finished && winnerId === player.userId;
    return (
        <div className={`${styles.match__player} ${isWinner ? styles["match__player--winner"] : ""}`}>
            <span className={styles.match__name}>{name}</span>
            <span className={styles.match__score}>{player.score ?? 0}</span>
        </div>
    );
}

function ByeCard({ userId }) {
    const name = useUserName(userId);
    return (
        <div className={`${styles.match} ${styles["match--bye"]}`}>
            <div className={styles.match__player}>
                <span className={styles.match__name}>{name}</span>
                <span className={styles.match__bye}>bye</span>
            </div>
        </div>
    );
}

function ChampionCard({ userId }) {
    const name = useUserName(userId);
    return (
        <div className={`${styles.match} ${styles["match--champion"]}`}>
            <div className={styles.match__player}>
                <span className={styles.match__name}>{name}</span>
                <span className={styles.match__crown}>winner</span>
            </div>
        </div>
    );
}