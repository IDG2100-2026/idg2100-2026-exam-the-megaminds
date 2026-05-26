import styles from './AboutPage.module.css';

export default function AboutPage() {
    return (
        <div className={styles.aboutContainer}>
            <section className={styles.hero}>
                <h1>About the Platform</h1>
                <p>Deep in the Sierra Nevada in a bunker fleeing from the tax authorities, a Spanish man and a Belarussian needed a game to play with only some dice and some cards.</p>
            </section>

            <div className={styles.sectionsContainer}>
                <section className={styles.section}>
                    <h2>The Early Stage</h2>
                    <p>To begin with, both of the men tried to play Texas Hold'em but cheating was so rampant between the men that they went over to Yahtzee.</p>
                    <p>Then the brightest idea came to mind: what about combining the two games? Spanish Poker Dice was born—the perfect Yahtzee poker blend where cheating and holding your dice is part of the game.</p>
                </section>

                <section className={styles.section}>
                    <h2>The Online Era</h2>
                    <p>The game spread nationwide after the story of the game reached the cell blocks where the men were found, turning it into a national phenomenon.</p>
                    <p>This platform is made to honor those men and their genius invention and bring it online to the masses!</p>
                </section>
            </div>
        </div>
    );
}