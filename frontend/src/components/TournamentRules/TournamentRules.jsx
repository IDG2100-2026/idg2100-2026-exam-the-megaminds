import styles from "./TournamentRules.module.css";

export default function TournamentRules({format, minPlayers, maxPlayers, buyIn = 0, eloRange}) {
    if (!format) return null;

    return (
        <dl className={styles.rules}>
            <div className={styles.rules__row}>
                <dt>Format</dt>
                <dd>Best of {format.bestof}</dd>
            </div>
            <div className={styles.rules__row}>
                <dt>Straights</dt>
                <dd>{format.straightallowed ? "Allowed" : "Not allowed"}</dd>
            </div>
            <div className={styles.rules__row}>
                <dt>Round time</dt>
                <dd>{format.roundTime}s</dd>
            </div>
            <div className={styles.rules__row}>
                <dt>Players</dt>
                <dd>{minPlayers} – {maxPlayers}</dd>
            </div>
            <div className={styles.rules__row}>
                <dt>Buy-in</dt>
                <dd>{buyIn > 0 ? `${buyIn} points` : "Free entry"}</dd>
            </div>
            <div className={styles.rules__row}>
                <dt>Elo range</dt>
                <dd>
                    {eloRange && (eloRange.min != null || eloRange.max != null)
                        ? `${eloRange.min ?? 0} – ${eloRange.max ?? "∞"}`
                        : "Open to all"}
                </dd>
            </div>
        </dl>
    );
}
