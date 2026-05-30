import { useParams, useNavigate, Link } from 'react-router';
import { useEffect, useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAppContext } from '@/context/AppContext';
import { userService, gameService, commentService } from '@/services/api';
import GameBoard from '@/components/GameBoard/GameBoard';
import styles from './GamePage.module.css';
import { enrichGames } from '@/utils/enrichPlayers';

export default function GamePage() {
    const { gameid } = useParams();
    const navigate = useNavigate();
    const { user } = useAppContext();
    const [game, setGame] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);
    const { lastMessage, connected, send } = useWebSocket(gameid);
    const [joining, setJoining] = useState(false);
    const [joinError, setJoinError] = useState('');

    const isInGame = !!user && game?.players?.some(p => p.userId === user.userId);
    const hasRoom = (game?.players?.length ?? 0) < (game?.rules?.numPlayers ?? 2);
    const joinable = game?.status === 'pending' && hasRoom;
    const canJoin = !!user && joinable && !isInGame;

    
    const handleJoin = async () => {
        setJoining(true);
        setJoinError('');
        try {
            await gameService.joinGame(gameid);
            window.location.reload();
        } catch (err){
            setJoinError(err.message || 'Failed to join game');
            setJoining(false);
        }
    };
    const loadComments = () => {
        commentService.getGameComments(gameid)
            .then(res => setComments(Array.isArray(res.data) ? res.data : []))
            .catch(() => {});
    };

    useEffect(() => {
        gameService.getGame(gameid)
            .then(res => setGame(res.data))
            .catch(() => setNotFound(true));
        commentService.getGameComments(gameid)
            .then(res => setComments(Array.isArray(res.data) ? res.data : []))
            .catch(() => {});
    }, [gameid]);

        useEffect(() => {
        if (lastMessage?.type === 'comment-added') {
            loadComments();
            return;
        }
        if (lastMessage?.type === 'game-over') {
            const target = game?.tournamentId ? `/tournament/${game.tournamentId}` : '/lobby';
            setTimeout(() => navigate(target), 4000);
            return;
        }
        if (lastMessage?.type !== 'state') return;
        const wsPlayerCount = lastMessage.state?.players?.length ?? 0;
        if (wsPlayerCount > (game?.players?.length ?? 0)) {
            gameService.getGame(gameid)
                .then(res => setGame(res.data))
                .catch(() => {});
        }
    }, [lastMessage]);


    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim() || !user) return;
        setCommentLoading(true);
        try {
            await commentService.addGameComment(gameid, commentText.trim());
            setCommentText('');
            loadComments();
            send({ type: 'comment-added' });
        } catch {
            // silent
        } finally {
            setCommentLoading(false);
        }
    };

       const handleLeave = () => {
        const msg = isInGame
            ? 'Leave this game? If betting has started you forfeit your current bet and get the rest of your chips back.'
            : 'Stop watching this game?';
        if (!window.confirm(msg)) return;
        if (isInGame) send({ type: 'leave-game' });
        setTimeout(() => navigate('/lobby'), 200);   // let the WS frame flush before the socket closes
    };

    if (notFound) {
        return (
            <div className={styles.page}>
                <p style={{ color: 'var(--theme-text-secondary)', padding: '2rem' }}>
                    This game does not exist. <button onClick={() => navigate('/lobby')} style={{ background: 'none', border: 'none', color: 'var(--theme-accent)', cursor: 'pointer', textDecoration: 'underline' }}>Back to lobby</button>
                </p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.statusBar}>
                <span className={`${styles.dot} ${connected ? styles.dotGreen : styles.dotRed}`} />
                <span className={styles.statusText}>{connected ? 'Live' : 'Connecting...'}</span>
                {game && (
                    <span className={styles.metaInfo}>
                        Best of {game.rules?.bestof} · {game.rules?.roundTime}s · {game.rules?.numPlayers}p · {game.rules?.buyIn} pts buy-in
                    </span>
                )}
                {game && <span className={styles.gameId}>Game #{game.gameId?.slice(-6)}</span>}
            </div>
            
            <div className={styles.content}>
                <div className={styles.boardSection}>
                    {canJoin && (
                        <div className={styles.joinBar}>
                            <div className={styles.joinInfo}>
                                <span className={styles.joinTitle}>This game needs players</span>
                                <span className={styles.joinMeta}>
                                    {game.players?.length ?? 0}/{game.rules?.numPlayers} · {game.rules?.buyIn} pts buy-in
                                    {game.rules?.minElo != null && ` · min Elo ${game.rules.minElo}`}
                                    {game.rules?.maxElo != null && ` · max Elo ${game.rules.maxElo}`}
                                </span>
                            </div>
                            <button className={styles.joinBtn} onClick={handleJoin} disabled={joining}>
                                {joining ? 'Joining…' : 'Join game'}
                            </button>
                        </div>
                    )}
                    {joinError && <p className={styles.joinError}>{joinError}</p>}
                    {!user && joinable && (
                        <p className={styles.joinPrompt}><Link to="/login">Log in</Link> to join this game.</p>
                    )}
                    {game?.status === 'finished'
                    ? <GameResult game={game}/>
                    : <GameBoard game={game} send={send} lastMessage={lastMessage} />}
                    {game && game.status !== 'finished' && (
                        <button className={styles.leaveBtn} onClick={handleLeave}>
                            Leave Game
                        </button>
                    )}
                </div>

                <aside className={styles.sidebar}>
                    <h2 className={styles.sidebarTitle}>Comments</h2>
                    <div className={styles.commentsList}>
                        {comments.length === 0 && (
                            <p className={styles.noComments}>No comments yet. Be the first!</p>
                        )}
                        {comments.map(c => (
                            <div key={c._id} className={styles.comment}>
                                <div className={styles.commentHeader}>
                                    <span className={styles.commentAuthor}>{c.username ?? 'Unknown'}</span>
                                    <span className={styles.commentDate}>
                                        {new Date(c.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className={styles.commentText}>{c.text}</p>
                            </div>
                        ))}
                    </div>
                    {user ? (
                        <form className={styles.commentForm} onSubmit={handleAddComment}>
                            <textarea
                                className={styles.commentInput}
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                placeholder="Write a comment…"
                                rows={3}
                                maxLength={500}
                            />
                            <button
                                type="submit"
                                className={styles.commentSubmit}
                                disabled={commentLoading || !commentText.trim()}
                            >
                                {commentLoading ? 'Posting…' : 'Post'}
                            </button>
                        </form>
                    ) : (
                        <p className={styles.loginPrompt}>Log in to comment</p>
                    )}
                </aside>
            </div>
        </div>
    );
}
function GameResult({ game }) {
    const buyIn = game.rules?.buyIn ?? 0;
    // Rank the same way the winner is decided: most rounds won, then most chips.
    const players = [...(game.players ?? [])].sort(
        (a, b) => (b.score ?? 0) - (a.score ?? 0) || (b.stack ?? 0) - (a.stack ?? 0)
    );
    const winner = players.find(p => p.userId === game.winnerId);

    return (
        <div className={styles.result}>
            <div className={styles.resultHeader}>
                <span className={styles.resultBadge}>Finished</span>
                <h2 className={styles.resultTitle}>
                    {winner ? `${winner.username ?? 'Player'} wins!` : 'Game Over'}
                </h2>
                <p className={styles.resultSubtitle}>Best of {game.rules?.bestof}</p>
            </div>
            <ol className={styles.scoreList}>
                {players.map((p, i) => {
                    const isWinner = p.userId === game.winnerId;
                    const wins = p.score ?? 0;
                    const chips = p.stack ?? 0;
                    const delta = chips - buyIn;
                    const deltaClass = delta > 0 ? styles.deltaUp : delta < 0 ? styles.deltaDown : styles.deltaZero;
                    return (
                        <li key={p.userId} className={`${styles.scoreRow} ${isWinner ? styles.scoreRowWinner : ''}`}>
                            <span className={styles.scoreRank}>{i + 1}</span>
                            <span className={styles.scoreName}>
                                {isWinner && <span className={styles.crown}>🏆</span>}
                                {p.username ?? 'Player'}
                            </span>
                            <span className={styles.scoreWins}>{wins} {wins === 1 ? 'win' : 'wins'}</span>
                            <span className={styles.scoreChips}>
                                {chips} chips
                                {buyIn > 0 && (
                                    <span className={`${styles.delta} ${deltaClass}`}>
                                        {delta > 0 ? `+${delta}` : delta}
                                    </span>
                                )}
                            </span>
                        </li>
                    );
                })}
            </ol>
            {buyIn > 0 && (
                <p className={styles.resultPot}>
                    Buy-in {buyIn} chips · pot {buyIn * (game.players?.length ?? 0)}
                </p>
            )}
        </div>
    );
}
