import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
                <StatCard label="Recent Finished Games" value={activity?.recentGames?.length ?? "—"} />
            </div>
        </section>
    );
}

function GamesPreview() {
    const [games, setGames] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        gameService.getAllGames(1, 20).then((data) => {
            const pending = Array.isArray(data)
                ? data.filter(g => g?.gameId && g.status === "pending").slice(0, 4)
                : [];
            setGames(pending);
        }).catch(() => {});
    }, []);

    if (games.length === 0) return null;

    return (
        <section className={styles.home__section}>
            <div className={styles.home__sectionHeader}>
                <h2 className={styles.home__sectionTitle}>Open Games — Join Now</h2>
                <Link to="/lobby" className={styles.home__seeAll}>See all →</Link>
            </div>
            <div className={styles.gamesGrid}>
                {games.map((g) => (
                    <div key={g.gameId} className={styles.gameCard}>
                        <div className={styles.gameCardTop}>
                            <span className={`${styles.statusBadge} ${styles.status_pending}`}>
                                Waiting for player
                            </span>
                            <span className={styles.gameCardId}>{g.gameId}</span>
                        </div>
                        <div className={styles.gameCardRules}>
                            <span>Best of {g.rules?.bestof}</span>
                            <span>{g.rules?.straightallowed ? "Straights ✓" : "No Straights"}</span>
                            <span>{g.rules?.roundTime}s timer</span>
                        </div>
                        <div className={styles.gameCardFooter}>
                            <span>{g.players?.length ?? 0} / 2 players</span>
                            <button className={styles.viewBtn} onClick={() => navigate(`/game/${g.gameId}`)}>
                                Join →
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function RecentGames() {
    const [games, setGames] = useState([]);
    const navigate = useNavigate();

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
                    <div key={g.gameId} className={styles.gameCard}>
                        <div className={styles.gameCardTop}>
                            <span className={`${styles.statusBadge} ${styles.status_finished}`}>
                                Finished
                            </span>
                            <span className={styles.gameCardId}>{g.gameId}</span>
                        </div>
                        <div className={styles.gameCardRules}>
                            <span>Best of {g.rules?.bestof}</span>
                            <span>{g.rules?.straightallowed ? "Straights ✓" : "No Straights"}</span>
                            <span>{g.rules?.roundTime}s timer</span>
                        </div>
                        <div className={styles.gameCardFooter}>
                            <span>Winner: {g.winnerId ?? "—"}</span>
                            <button className={styles.viewBtn} onClick={() => navigate(`/game/${g.gameId}`)}>
                                View →
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
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
