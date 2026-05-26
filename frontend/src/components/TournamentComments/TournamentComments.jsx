import {useEffect, useState, useCallback} from "react";
import {useAppContext} from "@/context/AppContext";
import {commentService, userService} from "@/services/api";
import {useTournamentSocket} from "@/hooks/useTournamentSocket";
import styles from "./TournamentComments.module.css";

export default function TournamentComments({tournamentId}) {
    const {user} = useAppContext();
    const [comments, setComments] = useState([]);
    const [names, setNames] = useState({});
    const [text, setText] = useState("");
    const [error, setError] = useState(null);
    const [posting, setPosting] = useState(false);

    const {lastMessage, connected} = useTournamentSocket(tournamentId);

    const addComment = useCallback((comment) => {
        setComments(prev =>
            prev.some(c => c.commentId === comment.commentId) ? prev : [comment, ...prev]
        );
    }, []);

    useEffect(()=>{
        let cancelled = false;
        commentService.getTournamentComments(tournamentId)
            .then(res => {if (!cancelled) setComments(res.data ?? []); })
            .catch(err => {if (!cancelled) setError(err.message); })
                return () => {cancelled = true; };
    }, [tournamentId]);

    useEffect(() => {
        if (lastMessage?.type === "new-comment") addComment(lastMessage.comment);
    }, [lastMessage, addComment]);

    // Resolve any userIds that havent been looked up
    useEffect(()=> {
      const missing = [...new Set(comments.map(c => c.userId))].filter(id => !(id in names));
      if (missing.length === 0) return;
      let cancelled = false;
      Promise.all(
        missing.map(id =>
            userService.getUser(id).then(u => [id, u.username]).catch(() => [id, `User ${id}`])
        )
      ).then(pairs => {if (!cancelled) setNames(prev => ({...prev, ...Object.fromEntries(pairs)})); });
      return () => { cancelled = true; };
    }, [comments, names]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!text.trim()) return;
        setPosting(true);
        setError(null)
        try {
            const res = await commentService.addTournamentComment(tournamentId, text.trim());
            if (res.data) addComment(res.data);
            setText("");
        } catch(err) {
            setError(err.message);
        } finally {
            setPosting(false);
        }
    }
    return (
        <section className={styles.comments}>
            <h2 className={styles.comments__heading}>Comments
                {connected && <span className={styles.comments__live}>● Live</span>}
            </h2>

            {comments.length === 0 ? (
                <p className={styles.comments__empty}>No comments yet.</p>
            ) : (
            <ul className={styles.comments__list}>
                {comments.map(c => (
                    <li key={c.commentId} className={styles.comments__item}>
                        <span className={styles.comments__author}>{names[c.userId] ?? `User ${c.userId}`}</span>
                        <p className={styles.comments__text}>{c.text}</p>
                    </li>
                ))}
            </ul>
            )}
            {user ? (
                <form className={styles.comments__form} onSubmit={handleSubmit}>
                    <textarea
                        className={styles.comments__input}
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Add a comment…"
                        rows={2}
                        maxLength={500}
                    />
                    {error && <p className={styles.comments__error}>{error}</p>}
                    <button className={styles.comments__submit} disabled={posting || !text.trim()}>
                        {posting ? "Posting…" : "Post comment"}
                    </button>
                </form>
            ) : (
                <p className={styles.comments__empty}>Log in to comment.</p>
            )}
        </section>
    )
}