import placeholderPic from "@/assets/profile-pic-placeholder.svg";
import { variantName } from "@/utils/gameVariant";
import styles from "./LobbyGameCard.module.css";

export default function LobbyGameCard({ game, user, joiningId, onViewGame, onJoinGame }) {
    const avgElo = game.players.length > 0
        ? (game.players.reduce((sum, p) => sum + (p.elo ?? 1000), 0) / game.players.length).toFixed(0)
        : '—';
    const isUserInGame = user && game.players.some(p => p.userId === user.userId);
    const canJoin = game.players.length < game.rules.numPlayers && !isUserInGame;

    return (
        <div className={styles.gameCard}>
            <div className={styles.gameHeader}>
                <div className={styles.eloDisplay}>Avg Elo: <span className={styles.eloBadge}>{avgElo}</span></div>
                <div className={styles.playersCount}>{game.players.length}/{game.rules.numPlayers} Players</div>
            </div>

            <div className={styles.rulesDisplay}>
                <span className={styles.ruleBadge}>Best of {game.rules.bestof}</span>
                <span className={styles.ruleBadge}>{game.rules.straightallowed ? "Straights" : "No Straights"}</span>
                <span className={styles.ruleBadge}>{variantName(game.rules)}</span>
            </div>

            <div className={styles.playersDisplay}>
                {game.players.map((player, idx) => (
                    <div key={idx} className={styles.playerTag}>
                        <img
                            src={player.profilePicture
                                ? `${import.meta.env.VITE_API_URL}${player.profilePicture}`
                                : placeholderPic}
                            alt={player.username}
                            className={styles.playerAvatar}
                        />
                        <span className={styles.playerInfo}>{player.username} ({player.elo})</span>
                    </div>
                ))}
                {game.players.length === 1 && (
                    <div className={styles.playerTagEmpty}>⏳ Waiting...</div>
                )}
            </div>

            <div className={styles.actionButtons}>
                <button className={styles.viewBtn} onClick={() => onViewGame(game.gameId)}>
                    View Game
                </button>
                {canJoin && (
                    <button
                        className={`${styles.joinBtn} ${joiningId === game.gameId ? styles.joining : ""}`}
                        onClick={() => onJoinGame(game.gameId)}
                        disabled={joiningId === game.gameId}
                    >
                        {joiningId === game.gameId ? "Joining..." : "Join"}
                    </button>
                )}
                {isUserInGame && <span className={styles.inGameBadge}>✓ Joined</span>}
            </div>
        </div>
    );
}
