import {Link} from "react-router";
import TournamentCard from "@/components/TournamentCard/TournamentCard";
import {useTournaments} from "@/hooks/useTournaments";
import styles from "./TournamentPreview.module.css";

export default function TournamentPreview() {
    const { tournaments, loading, error } = useTournaments({
        status: "pending,in-progress",
        limit: 5,
    });

    return (
        <section>
            <div>
                <h2 className={styles.preview__title}>Upcoming Tournaments</h2>
                <Link to="/tournament" className={styles.preview__link}>See all →</Link>
            </div>

            {error && <p className={styles.preview__status}>Error: {error}</p>}
            {loading && tournaments.length === 0 && <p className={styles.preview__status}>Loading…</p>}
            {!loading && tournaments.length === 0 && <p className={styles.preview__status}>No upcoming tournaments.</p>}

            <div className={styles.preview__grid}>
                {tournaments.map(t => (
                    <TournamentCard key={t.tournamentId} tournament={t} variant="preview" />
                ))}
            </div>
        </section>
    );
}