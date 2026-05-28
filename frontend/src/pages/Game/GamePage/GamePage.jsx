import { useParams, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAppContext } from '@/context/AppContext';
import { gameService, commentService } from '@/services/api';
import GameBoard from '@/components/GameBoard/GameBoard';
import styles from './GamePage.module.css';

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

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim() || !user) return;
        setCommentLoading(true);
        try {
            await commentService.addGameComment(gameid, commentText.trim());
            setCommentText('');
            loadComments();
        } catch {
            // silent
        } finally {
            setCommentLoading(false);
        }
    };

    const handleLeave = () => {
        if (window.confirm('Leave this game? The game will continue and your dice will be auto-rolled.')) {
            navigate('/lobby');
        }
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
                    <GameBoard game={game} send={send} lastMessage={lastMessage} />
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
