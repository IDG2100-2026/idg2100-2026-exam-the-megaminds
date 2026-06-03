import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useAppContext } from "@/context/AppContext";
import { gameService, userService } from "@/services/api";
import { enrichGames } from "@/utils/enrichPlayers";
import placeholderPic from "@/assets/profile-pic-placeholder.svg";
import LobbyGameCard from "@/components/LobbyGameCard/LobbyGameCard";
import styles from "./LobbyPage.module.css";

const PAGE_SIZE = 10;

export default function LobbyPage() {
    const navigate = useNavigate();
    const { user } = useAppContext();

    const [games, setGames] = useState([]);
    const [userGames, setUserGames] = useState([]);
    const [liveGames, setLiveGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [joinMessage, setJoinMessage] = useState("");
    const [joiningId, setJoiningId] = useState(null);

    const [filters, setFilters] = useState({
        minElo: 800,
        maxElo: 2500,
        bestOf: "all",
        straights: "all",
        roundTime: "all",
    });

    const [sortBy, setSortBy] = useState("newest");

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        const fetchGames = async () => {
            try {
                setLoading(true);
                const data = await gameService.getAllGames(1, PAGE_SIZE, 'pending');

                const allGames = data || [];
                setHasMore(allGames.length === PAGE_SIZE);
                setPage(1);

                const pending = allGames.filter(game =>
                    game.players.length < game.rules.numPlayers
                );
                const enriched = await enrichGames(pending);
                setGames(enriched);

                const liveData = await gameService.getAllGames(1, 10, 'in-progress');
                const live = (liveData || []).filter(g =>
                    !user || !g.players.some(p => p.userId === user?.userId)
                );
                setLiveGames(await enrichGames(live));

                if (user) {
                    const mine = await userService.getUserGames(user.userId, 1, 50);
                    const active = (mine || []).filter(game => game.status !== 'finished');
                    const enrichedActive = await enrichGames(active);
                    setUserGames(enrichedActive);
                } else {
                    setUserGames([]);
                }
            } catch (err) {
                setError('Failed to load games');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchGames();
    }, [user]);

    const filteredGames = useMemo(() => {
        let result = [...games];

        result = result.filter(game => {
            if (!game.players.length) return true;
            const avgElo = game.players.reduce((sum, p) => sum + (p.elo ?? 1000), 0) / game.players.length;
            return avgElo >= filters.minElo && avgElo <= filters.maxElo;
        });

        if (filters.bestOf !== "all") {
            result = result.filter(game => game.rules.bestof === parseInt(filters.bestOf));
        }

        if (filters.straights !== "all") {
            const allowStraights = filters.straights === "yes";
            result = result.filter(game => game.rules.straightallowed === allowStraights);
        }

        if (filters.roundTime !== "all") {
            result = result.filter(game => game.rules.roundTime === parseInt(filters.roundTime));
        }

        switch (sortBy) {
            case "newest":
                result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case "highest-elo":
                result.sort((a, b) => {
                    const avgA = a.players.reduce((sum, p) => sum + (p.elo ?? 1000), 0) / (a.players.length || 1);
                    const avgB = b.players.reduce((sum, p) => sum + (p.elo ?? 1000), 0) / (b.players.length || 1);
                    return avgB - avgA;
                });
                break;
            case "lowest-elo":
                result.sort((a, b) => {
                    const avgA = a.players.reduce((sum, p) => sum + (p.elo ?? 1000), 0) / (a.players.length || 1);
                    const avgB = b.players.reduce((sum, p) => sum + (p.elo ?? 1000), 0) / (b.players.length || 1);
                    return avgA - avgB;
                });
                break;
            default:
                break;
        }

        return result;
    }, [games, filters, sortBy]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleJoinGame = async (gameId) => {
        if (!user) { navigate("/login"); return; }
        setJoiningId(gameId);
        setJoinMessage("");
        try {
            await gameService.joinGame(gameId);
            setJoinMessage("Joined! Redirecting to game...");
            setTimeout(() => navigate(`/game/${gameId}`), 1000);
        } catch (err) {
            setJoinMessage(err.message || 'Failed to join game');
            setJoiningId(null);
        }
    };

    const handleViewGame = (gameId) => {
        navigate(`/game/${gameId}`);
    };

    const handleLoadMore = async () => {
        const nextPage = page + 1;
        setLoadingMore(true);
        try {
            const data = await gameService.getAllGames(nextPage, PAGE_SIZE, 'pending');
            const newGames = data || [];
            setHasMore(newGames.length === PAGE_SIZE);
            setPage(nextPage);
            const pending = newGames.filter(game =>
                game.players.length < game.rules.numPlayers
            );
            const endriched = await enrichGames(pending);
            setGames(prev => [...prev, ...endriched]);
        } catch { //

        } finally {
            setLoadingMore(false);
        }
    };

    if (loading) {
        return <div className={styles.container}><div className={styles.loadingSpinner}>Loading games...</div></div>;
    }

    return (
        <div className={styles.container}>
            {}
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <h1>Game Lobby</h1>
                    <p>Find and join a game, or create your own</p>
                </div>
                <button className={styles.createBtn} onClick={() => navigate("/create-game")}>
                    Create Game
                </button>
            </div>

            {}
            {user && userGames.length > 0 && (
                <div className={styles.yourGamesSection}>
                    <h2>Your Current Games</h2>
                    <div className={styles.yourGamesList}>
                        {userGames.map(game => {
                            const eloSum = game.players.reduce((sum, p) => sum + (p.elo ?? 0), 0);
                            const avgElo = game.players.length > 0 ? (eloSum / game.players.length).toFixed(0) : '—';
                            const statusLabel = game.status === 'pending' ? 'Waiting for Opponent' : 'In Progress';
                            const statusBadgeClass = game.status === 'pending' ? styles.pendingBadge : styles.inProgressBadge;

                            return (
                                <div key={game.gameId} className={styles.yourGameCard}>
                                    <div className={styles.gameInfo}>
                                        <div className={styles.gameStatus}>
                                            <span className={statusBadgeClass}>{statusLabel}</span>
                                            <span className={styles.eloInfo}>Avg Elo: {avgElo}</span>
                                        </div>
                                        <div className={styles.gameRules}>
                                            Best of {game.rules.bestof} | {game.rules.straightallowed ? 'Straights' : 'No Straights'} | {game.rules.roundTime}s
                                        </div>
                                        <div className={styles.playersInfo}>
                                            {game.players.map((player, idx) => (
                                                <div key={idx} className={styles.playerTagSmall}>
                                                    <img
                                                        src={player.profilePicture ? `${import.meta.env.VITE_API_URL}${player.profilePicture}` : placeholderPic}
                                                        alt={player.username}
                                                        className={styles.playerAvatarSmall}
                                                    />
                                                    <span>{player.username}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <button className={styles.viewGameBtn} onClick={() => handleViewGame(game.gameId)}>
                                        View
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {}
            {liveGames.length > 0 && (
                <div className={styles.liveSection}>
                    <h2 className={styles.liveSectionTitle}>
                        <span className={styles.liveDot} />
                        Live Games
                    </h2>
                    <div className={styles.liveList}>
                        {liveGames.map(game => {
                            const [p1, p2] = game.players ?? [];
                            return (
                                <div key={game.gameId} className={styles.liveCard}>
                                    <div className={styles.liveCardPlayers}>
                                        <span>{p1?.username ?? '?'}</span>
                                        <span className={styles.liveVs}>vs</span>
                                        <span>{p2?.username ?? '?'}</span>
                                    </div>
                                    <div className={styles.liveCardMeta}>
                                        Best of {game.rules?.bestof} · {game.rules?.roundTime}s
                                    </div>
                                    <button
                                        className={styles.spectateBtn}
                                        onClick={() => navigate(`/game/${game.gameId}`)}
                                    >
                                        Spectate →
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {}
            <div className={styles.filterPanel}>
                <div className={styles.filterGroup}>
                    <label>Elo Range</label>
                    <div className={styles.eloRange}>
                        <div>
                            <input type="number" name="minElo" value={filters.minElo} onChange={handleFilterChange} min="0" className={styles.eloInput} />
                            <span className={styles.eloLabel}>Min</span>
                        </div>
                        <span className={styles.eloSeparator}>→</span>
                        <div>
                            <input type="number" name="maxElo" value={filters.maxElo} onChange={handleFilterChange} max="3000" className={styles.eloInput} />
                            <span className={styles.eloLabel}>Max</span>
                        </div>
                    </div>
                </div>

                <div className={styles.filterGroup}>
                    <label>Best Of</label>
                    <select name="bestOf" value={filters.bestOf} onChange={handleFilterChange} className={styles.select}>
                        <option value="all">All</option>
                        <option value="3">Best of 3</option>
                        <option value="5">Best of 5</option>
                        <option value="7">Best of 7</option>
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label>Straights</label>
                    <select name="straights" value={filters.straights} onChange={handleFilterChange} className={styles.select}>
                        <option value="all">All</option>
                        <option value="yes">Allowed</option>
                        <option value="no">Not Allowed</option>
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label>Round Time</label>
                    <select name="roundTime" value={filters.roundTime} onChange={handleFilterChange} className={styles.select}>
                        <option value="all">All</option>
                        <option value="10">10 seconds</option>
                        <option value="30">30 seconds</option>
                        <option value="90">90 seconds</option>
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label>Sort By</label>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={styles.select}>
                        <option value="newest">Newest First</option>
                        <option value="highest-elo">Highest Elo</option>
                        <option value="lowest-elo">Lowest Elo</option>
                    </select>
                </div>
            </div>

            {}
            {error && <div className={styles.errorBox}>{error}</div>}
            {joinMessage && (
                <div className={`${styles.messageBox} ${joinMessage.includes("Joined") ? styles.success : styles.error}`}>
                    {joinMessage}
                </div>
            )}

            {}
            <div className={styles.resultsHeader}>
                <h2>Available Games ({filteredGames.length})</h2>
            </div>

            {filteredGames.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>No games found matching your filters</p>
                    <button className={styles.createBtn} onClick={() => navigate("/create-game")}>
                        Create one now
                    </button>
                </div>
            ) : (
                <div className={styles.gamesList}>
                    {filteredGames.map(game => (
                        <LobbyGameCard
                            key={game._id}
                            game={game}
                            user={user}
                            joiningId={joiningId}
                            onViewGame={handleViewGame}
                            onJoinGame={handleJoinGame}
                        />
                    ))}
                </div>
            )}

            {hasMore && (
                <button className={styles.loadMoreBtn} onClick={handleLoadMore} disabled={loadingMore}>
                    {loadingMore ? 'Loading...' : 'Load more games'}
                </button>
            )}
        </div>
    );
}
