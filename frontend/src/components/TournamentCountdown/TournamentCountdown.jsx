import { useCountdown } from "@/hooks/useCountdown";
import styles from "./TournamentCountdown.module.css";

export default function TournamentCountdown({ targetDate, label = "Starts in" }) {
    const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDate);

    if (isExpired) return null;

    return (
        <div className={styles.countdown}>
            <span className={styles.countdown__label}>{label}</span>
            <div className={styles.countdown__units}>
                <Unit value={days} suffix="d" />
                <Unit value={hours} suffix="h" />
                <Unit value={minutes} suffix="m" />
                <Unit value={seconds} suffix="s" />
            </div>
        </div>
    );
}

function Unit({ value, suffix }) {
    return (
        <span className={styles.countdown__unit}>
            <strong>{String(value).padStart(2, "0")}</strong>{suffix}
        </span>
    );
}
