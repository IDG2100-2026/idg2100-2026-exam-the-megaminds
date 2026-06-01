import {Link} from "react-router";
import StatusBadge from "../TournamentStatusBadge/TournamentStatusBadge";
import styles from "./TournamentCard.module.css";

export default function TournamentCard({ tournament, variant = "list" }) {
    const { tournamentId, title, description, status, startDate, participants, maxPlayers, format } = tournament;

    return (
        <Link to={`/tournament/${tournamentId}`} className={`${styles.card} ${styles[variant]}`}>
            <div className={styles.card__header}>
                <h3 className={styles.card__title}>{title}</h3>
                <StatusBadge status={status} />
            </div>

            {variant === "list" && description && (
                <p className={styles.card__description}>{description}</p>
            )}

            <dl className={styles.card__meta}>
                <div>
                    <dt>Starts</dt>
                    <dd>{new Date(startDate).toLocaleDateString()}</dd>
                </div>
                <div>
                    <dt>Players</dt>
                    <dd>{participants?.length ?? 0} / {maxPlayers}</dd>
                </div>
            </dl>

            {format && (
                <ul className={styles.card__rules}>
                    <li className={styles.pill}>Bo{format.bestof}</li>
                    {format.straightallowed && <li className={styles.pill}>Straights allowed</li>}
                    <li className={styles.pill}>{format.roundTime}s rounds</li>
                </ul>
            )}
            {status === 'in-progress' && (
                <span className={styles.watchBadge}>
                    <span className={styles.watchDot} />
                    Watch live →
                </span>
            )}
        </Link>
    );
}
