import styles from "./TournamentStatusBadge.module.css";
const STATUS_CONFIG = {
        pending: {label: "Upcoming", className: "upcoming"},
        "in-progress": {label: "Ongoing", className: "ongoing"},
        finished: {label: "Finished", className: "finished"},
        cancelled: {label: "Cancelled", className: "cancelled"},
    };

export default function TournamentStatusBadge({ status }) {
    const config = STATUS_CONFIG[status];
    if(!config) return null;

    return(
        <span className={`${styles.badge} ${styles[config.className]}`}>
            {config.label}
        </span>
    );

}