import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { useUserName } from "@/hooks/useUsername";
import { platformService, gameService } from "@/services/api";
import TournamentPreview from "@/components/TournamentPreview/TournamentPreview";
import styles from "./HomePage.module.css";

export default function HomePage() {
    return (
        <main className={styles.home}>
            <HeroSection />
            <ActivityStats />
            <GamesPreview />
            <RecentGames />
            <section className={styles.home__section}>
                <TournamentPreview />
            </section>
        </main>
    );
}

function HeroSection() {
    return (
        <section className={styles.home__hero}>
            <h1 className={styles.home__title}>Spanish Poker Dice</h1>
            <p className={styles.home__tagline}>
                Challenge players worldwide in the classic Spanish dice game.
                Roll, bluff, and climb the leaderboard.
            </p>
            <div className={styles.home__cta}>
                <Link to="/create-game" className={styles.btnPrimary}>Create Game</Link>
                <Link to="/lobby" className={styles.btnSecondary}>Browse Lobby</Link>
            </div>
        </section>
    );
}

function ActivityStats() {
    const [activity, setActivity] = useState(null);

    useEffect(() => {
        platformService.getActivity().then(setActivity).catch(() => {});
    }, []);

    return (
        <section className={styles.home__section}>
            <h2 className={styles.home__sectionTitle}>Platform Activity</h2>
            <div className={styles.statsRow}>
                <StatCard label="Games in Progress" value={activity?.ongoingGames ?? "—"} />
                <StatCard label="Active Players (7 days)" value={activity?.activeUsersWeek ?? "—"} />
                <StatCard label="Games Played (7 days)" value={activity?.gamesPlayedWeek ?? "—"} />
            </div>
        </section>
    );
}

function GamesPreview() {
    const { lobbyCount } = useAppContext();
    const [games, setGames] = useState([]);

    useEffect(() => {
        gameService.getAllGames(1, 20).then((data) => {
            const pending = Array.isArray(data)
                ? data.filter(g => g?.gameId && g.status === "pending").slice(0, lobbyCount)
                : [];
            setGames(pending);
        }).catch(() => {});
    }, [lobbyCount]);

    if (games.length === 0) return null;

    return (
        <section className={styles.home__section}>
            <div className={styles.home__sectionHeader}>
                <h2 className={styles.home__sectionTitle}>Open Games — Join Now</h2>
                <Link to="/lobby" className={styles.home__seeAll}>See all →</Link>
            </div>
            <div className={styles.gamesGrid}>
                {games.map((g) => (
                    <Link key={g.gameId} to={`/game/${g.gameId}`} className={styles.gameCard}>
                        <div className={styles.gameCard__header}>
                            <h3 className={styles.gameCard__title}>Game #{g.gameId?.slice(-6)}</h3>
                            <span className={`${styles.statusBadge} ${styles.status_pending}`}>Open</span>
                        </div>
                        <dl className={styles.gameCard__meta}>
                            <div><dt>Players</dt><dd>{g.players?.length ?? 0} / 2</dd></div>
                            <div><dt>Buy-in</dt><dd>{g.rules?.buyIn} pts</dd></div>
                        </dl>
                        <ul className={styles.gameCard__rules}>
                            <li className={styles.pill}>Bo{g.rules?.bestof}</li>
                            {g.rules?.straightallowed && <li className={styles.pill}>Straights</li>}
                            <li className={styles.pill}>{g.rules?.roundTime}s</li>
                        </ul>
                    </Link>
                ))}
            </div>
        </section>
    );
}

function RecentGames() {
    const [games, setGames] = useState([]);

    useEffect(() => {
        gameService.getAllGames(1, 20).then((data) => {
            const finished = Array.isArray(data)
                ? data.filter(g => g?.gameId && g.status === "finished").slice(0, 6)
                : [];
            setGames(finished);
        }).catch(() => {});
    }, []);

    if (games.length === 0) return null;

    return (
        <section className={styles.home__section}>
            <div className={styles.home__sectionHeader}>
                <h2 className={styles.home__sectionTitle}>Recent Finished Games</h2>
                <Link to="/lobby" className={styles.home__seeAll}>See all →</Link>
            </div>
            <div className={styles.gamesGrid}>
                {games.map((g) => (
                    <WinnerGameCard key={g.gameId} game={g} />
                ))}
            </div>
        </section>
    );
}

function WinnerGameCard({ game }) {
    const winnerName = useUserName(game.winnerId);
    return (
        <Link to={`/game/${game.gameId}`} className={styles.gameCard}>
            <div className={styles.gameCard__header}>
                <h3 className={styles.gameCard__title}>Game #{game.gameId?.slice(-6)}</h3>
                <span className={`${styles.statusBadge} ${styles.status_finished}`}>Finished</span>
            </div>
            <dl className={styles.gameCard__meta}>
                <div><dt>Winner</dt><dd>{winnerName}</dd></div>
                <div><dt>Players</dt><dd>{game.players?.length ?? 0}</dd></div>
            </dl>
            <ul className={styles.gameCard__rules}>
                <li className={styles.pill}>Bo{game.rules?.bestof}</li>
                {game.rules?.straightallowed && <li className={styles.pill}>Straights</li>}
                <li className={styles.pill}>{game.rules?.roundTime}s</li>
            </ul>
        </Link>
    );
}

function StatCard({ label, value }) {
    return (
        <div className={styles.statCard}>
            <div className={styles.statValue}>{value}</div>
            <div className={styles.statLabel}>{label}</div>
        </div>
    );
}
