import {useParams} from "react-router";
import {useTournament} from "@/hooks/useTournament";
import StatusBadge from "@/components/TournamentStatusBadge/TournamentStatusBadge";
import TournamentRules from "@/components/TournamentRules/TournamentRules";
import TournamentPlayerList from "@/components/TournamentPlayersList/TournamentPlayersList";
import JoinLeaveButton from "@/components/JoinLeaveButton/JoinLeaveButton";
import TournamentComments from "@/components/TournamentComments/TournamentComments";
import AdminTournamentControls from "@/components/AdminTournamentControls/AdminTournamentControls";
import TournamentCountdown from "@/components/TournamentCountdown/TournamentCountdown";
import styles from "./TournamentDetail.module.css";


export default function TournamentDetail() {
    const {tournamentid} = useParams();
    const {tournament, loading, error, refresh} = useTournament(tournamentid)
    if(loading) return <p className={styles.detail__status}>Loading Tournament...</p>;
    if(error) return <p className={styles.detail__status}>Error: {error}</p>;
    if(!tournament) return <p className={styles.detail__status}>Tournament not found.</p>;

    const {title, description, status, startDate, format,
        minPlayers, maxPlayers, participants, trophy} = tournament

    return(
        <main className={styles.detail}>
            <div className={styles.detail__header}>
                <h1 className={styles.detail__title}>{title}</h1>
                <StatusBadge status={status}/>
                <AdminTournamentControls tournament={tournament} onChange={refresh}/>
            </div>

            <p className={styles.detail__description}>{description}</p>

            <section className={styles.detail__section}>
                <h2 className={styles.detail__heading}>Details</h2>
                <dl className={styles.detail__facts}>
                    <div><dt>Starts</dt><dd>{new Date(startDate).toLocaleString()}</dd></div>
                    <div><dt>Signed up</dt><dd>{participants?.length ?? 0} / {maxPlayers}</dd></div>
                    {trophy?.title && <div><dt>Trophy</dt><dd>{trophy.title}</dd></div>}
                </dl>
                {status === "pending" && <TournamentCountdown targetDate={startDate} label="Starts in" />}
            </section>

            <section className={styles.detail__section}>
                <h2 className={styles.detail__heading}>Rules</h2>
                <TournamentRules format={format} minPlayers={minPlayers} maxPlayers={maxPlayers}/>
            </section>

            <section className={styles.detail__section}>
                <TournamentPlayerList participants={participants} maxPlayers={maxPlayers}/>
            </section>
            <section className={styles.detail__section}>
            <TournamentComments tournamentId={tournament.tournamentId} />
            </section>

            <JoinLeaveButton tournament={tournament} onChange={refresh} />
        </main>
    );
}
