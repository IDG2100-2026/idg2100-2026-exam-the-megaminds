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
import { useEffect } from "react";
import { TournamentSocketProvider, useTournamentSocketContext } from "@/context/TournamentSocketContext";
import TournamentBracket from "@/components/TournamentBracket/TournamentBracket";
import AwardWinner from "@/components/AwardWinner/AwardWinner";
import styles from "./TournamentDetail.module.css";


// Thin wrapper: opens the single tournament socket for the whole page, then renders
// the content inside it so the detail page and comments share one connection.
export default function TournamentDetail() {
    const { tournamentid } = useParams();
    return (
        <TournamentSocketProvider tournamentId={tournamentid}>
            <TournamentDetailContent tournamentid={tournamentid} />
        </TournamentSocketProvider>
    );
}

function TournamentDetailContent({ tournamentid }) {
    const { tournament, loading, error, refresh } = useTournament(tournamentid)
    const authorName = useUserName(tournament?.createdBy);
    const { user } = useAppContext();
    const { checking, isParticipant, lobbyOver } = usePlayerGameRedirect(tournament, user);
    const { lastMessage } = useTournamentSocketContext();

    useEffect(() => {
        if (['round-change', 'participant-change', 'tournament-updated'].includes(lastMessage?.type)) {
            refresh();
        }
    }, [lastMessage, refresh]);

    if (loading) return <p className={styles.detail__status}>Loading Tournament...</p>;
    if (error) return <p className={styles.detail__status}>Error: {error}</p>;
    if (!tournament) return <p className={styles.detail__status}>Tournament not found.</p>;

    const { title, description, status, startDate, format,
        minPlayers, maxPlayers, participants, trophy, buyIn, eloRange, nextRoundStartsAt } = tournament

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
                    <TournamentStandings key={`round-${tournament.currentRound}`} tournamentId={tournament.tournamentId} />
                </section>
            )}
            {(status === "in-progress" || status === "finished") && (
                <section className={styles.detail__section}>
                    <h2 className={styles.detail__heading}>Bracket</h2>
                    <TournamentBracket key={`round-${tournament.currentRound}`} tournament={tournament} />
                </section>
            )}
            {status === "in-progress" && nextRoundStartsAt && new Date(nextRoundStartsAt) > new Date() && (
                <section className={styles.detail__section}>
                    <TournamentCountdown targetDate={nextRoundStartsAt} label="Next round in" />
                </section>
            )}
            {status === "in-progress" && user?.role === "admin" && (
                <section className={styles.detail__section}>
                    <h2 className={styles.detail__heading}>Finish tournament</h2>
                    <AwardWinner tournament={tournament} onChange={refresh} />
                </section>
            )}
            {status === "in-progress" && isParticipant && (
                <section className={styles.detail__section}>
                    <p className={styles.detail__status}>
                        {checking
                            ? "Taking you to your game…"
                            : !lobbyOver
                                ? "Get ready — your next game is starting soon."
                                : "Your game has finished — waiting for the next round to start." }
                    </p>
                </section>
            )}
            {status === "in-progress" && !isParticipant && (
                <section className={styles.detail__section}>
                    <h2 className={styles.detail__heading}>Ongoing games</h2>
                    <OngoingGames key={`round-${tournament.currentRound}`} tournament={tournament} />
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
