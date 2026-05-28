import TournamentPreview from "@/components/TournamentPreview/TournamentPreview";
import styles from "./HomePage.module.css";

export default function HomePage() {
    return (
        <main className={styles.home}>
            <section className={styles.home__hero}>
                <h1 className={styles.home__title}>Spanish Poker Dice</h1>
                <p className={styles.home__tagline}>
                    Catchphrase Statement Question
                </p>
            </section>

            {/* Game-lobby preview, create-game, and platform-activity sections
                are teammates' areas — they mount here alongside this one. */}

            <section className={styles.home__section}>
                <TournamentPreview />
            </section>
        </main>
    );
}
