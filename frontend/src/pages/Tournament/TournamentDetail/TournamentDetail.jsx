import { useParams } from "react-router";
import { useTournament } from "@/hooks/useTournament";
import { useAppContext } from "@/context/AppContext";
import OngoingGames from "@/components/OngoingGames/OngoingGames";
import StatusBadge from "@/components/TournamentStatusBadge/TournamentStatusBadge";
import TournamentRules from "@/components/TournamentRules/TournamentRules";
import TournamentPlayerList from "@/components/TournamentPlayersList/TournamentPlayersList";
import JoinLeaveButton from "@/components/JoinLeaveButton/JoinLeaveButton";
import TournamentComments from "@/components/TournamentComments/TournamentComments";
import AdminTournamentControls from "@/components/AdminTournamentControls/AdminTournamentControls";
import TournamentCountdown from "@/components/TournamentCountdown/TournamentCountdown";
import { useUserName } from "@/hooks/useUsername";
import TournamentStandings from "@/components/TournamentStandings/TournamentStandings";
import { usePlayerGameRedirect } from "@/hooks/usePlayerGameRedirect";
import styles from "./TournamentDetail.module.css";


export default function TournamentDetail() {
    const { tournamentid } = useParams();
    const { tournament, loading, error, refresh } = useTournament(tournamentid)
    const authorName = useUserName(tournament?.createdBy);
    const { user } = useAppContext();
    const { checking, isParticipant } = usePlayerGameRedirect(tournament, user);
    if (loading) return <p className={styles.detail__status}>Loading Tournament...</p>;
    if (error) return <p className={styles.detail__status}>Error: {error}</p>;
    if (!tournament) return <p className={styles.detail__status}>Tournament not found.</p>;

    const { title, description, status, startDate, format,
        minPlayers, maxPlayers, participants, trophy, buyIn, eloRange } = tournament

    return (
        <main className={styles.detail}>
            <div className={styles.detail__header}>
                <h1 className={styles.detail__title}>{title}</h1>
                <StatusBadge status={status} />
                <AdminTournamentControls tournament={tournament} onChange={refresh} />
            </div>

            <p className={styles.detail__description}>{description}</p>

            <section className={styles.detail__section}>
                <h2 className={styles.detail__heading}>Details</h2>
                <dl className={styles.detail__facts}>
                    <div><dt>Starts</dt><dd>{new Date(startDate).toLocaleString()}</dd></div>
                    <div><dt>Signed up</dt><dd>{participants?.length ?? 0} / {maxPlayers}</dd></div>
                    <div><dt>Created by</dt><dd>{authorName}</dd></div>
                </dl>
                {status === "pending" && <TournamentCountdown targetDate={startDate} label="Starts in" />}
            </section>
            {(status === "in-progress" || status === "finished") && (
                <section className={styles.detail__section}>
                    <h2 className={styles.detail__heading}>Standings</h2>
                    <TournamentStandings tournamentId={tournament.tournamentId} />
                </section>
            )}
            {status === "in-progress" && isParticipant && (
                <section className={styles.detail__section}>
                    <p className={styles.detail__status}>
                        {checking
                            ? "Taking you to your game…"
                            : "Your game has finished — waiting for the next round to start."}
                    </p>
                </section>
            )}
            {status === "in-progress" && !isParticipant && (
                <section className={styles.detail__section}>
                    <h2 className={styles.detail__heading}>Ongoing games</h2>
                    <OngoingGames tournament={tournament} />
                </section>
            )}


            <section className={styles.detail__section}>
                <h2 className={styles.detail__heading}>Rules</h2>
                <TournamentRules format={format} minPlayers={minPlayers} maxPlayers={maxPlayers} buyIn={buyIn} eloRange={eloRange} />
            </section>
            <section className={styles.detail__section}>
                <h2 className={styles.detail__heading}>Trophy</h2>
                {trophy ? (
                    <div className={styles.detail__trophy}>
                        {trophy.imageUrl && (
                            <img
                                className={styles.detail__trophyImage}
                                src={trophy.imageUrl}
                                alt={`${trophy.title} trophy`}
                            />
                        )}
                        <p className={styles.detail__trophyTitle}>{trophy.title}</p>
                    </div>
                ) : (
                    <p className={styles.detail__trophyEmpty}>No trophy for this tournament.</p>
                )}
            </section>

            <section className={styles.detail__section}>
                <TournamentPlayerList participants={participants} maxPlayers={maxPlayers} />
            </section>
            <section className={styles.detail__section}>
                <TournamentComments tournamentId={tournament.tournamentId} />
            </section>

            <JoinLeaveButton tournament={tournament} onChange={refresh} />
        </main>
    );
}
