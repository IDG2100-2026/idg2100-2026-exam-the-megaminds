import {useEffect, useState} from "react";
import {userService} from "@/services/api";
import styles from "./TournamentPlayersList.module.css";

export default function TournamentPlayersList({ participants  = [], maxPlayers }) {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(()=> {
        let cancelled = false;
        Promise.all(participants.map(id => userService.getUser(id)))
            .then(users => {if (!cancelled) setPlayers(users); })
            .catch(() => {if (!cancelled) setPlayers([]); })
            .finally(() => {if (!cancelled) setLoading(false); })
        return () => {cancelled = true; }

    }, [participants]);
    if (loading) return <p className={styles.players__status}>Loading Players...</p>
    return (
        <section className={styles.players}>
            <h2 className={styles.players__heading}>Players ({participants.length}/{maxPlayers})</h2>
            {players.length === 0 ? (
                <p className={styles.players__status}>No players have joined yet.</p>
            ) : (
                <ul className={styles.players__list}>
                    {players.map(p=> (
                        <li key={p.userId} className={styles.players__item}>
                            <span className={styles.players__name}>{p.username}</span>
                            <span className={styles.players__elo}>{p.elo} Elo</span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
