import {useState} from "react"
import {useNavigate} from "react-router";
import {useAppContext} from "@/context/AppContext";
import { tournamentService} from "@/services/api";
import styles from "./AdminTournamentControls.module.css";

export default function AdminTournamentControls({tournament, onChange}) {
    const { user } = useAppContext();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    if (user?.role !== "admin") return null;
    const { tournamentId, status } = tournament;

    async function handleDelete() {
        if (!confirm("Delete this tournament permanently?")) return;
        await tournamentService.deleteTournament(tournamentId);
        navigate("/tournament");
    }
    async function handleCancel() {
        if (!confirm("Cancel this tournament? Players wont be able to join")) return;
        await tournamentService.updateTournament(tournamentId, {status: "cancelled" });
        onChange?.();
    }
    async function handleReopen() {
    await tournamentService.updateTournament(tournamentId, { status: "pending" });
    onChange?.();
    }
    async function run(action){
        setError(null);
        try {
            await action();
            onChange?.();
        } catch (err){
            setError(err.message);
        }
    }
    return (
        <div className={styles.controls}>
            <span className={styles.controls__label}>Admin</span>
            <button
                className={styles.controls__edit}
                onClick={() => navigate(`/admin/tournament/${tournamentId}/edit`)}
            >
                Edit
            </button>
            {status === "pending" && (
            <button
                className={styles.controls__start}
                onClick={() => run(() => tournamentService.startTournament(tournamentId))}
            >
                Start tournament
            </button>
            )}
            {status === "in-progress" && (
            <button className={styles.controls__advance} onClick={() => run(() => tournamentService.advanceRound(tournamentId))}>Advance Round</button>
            )}
            {status !== "cancelled" && status !== "finished" && (
                <button className={styles.controls__cancel} onClick={handleCancel}>Cancel</button>
            )}
            {status === "cancelled" && (
            <button className={styles.controls__reopen} onClick={handleReopen}>Reopen</button>
            )}

            <button className={styles.controls__delete} onClick={handleDelete}>Delete</button>
            {error && <p className={styles.controls__error}>{error}</p>}

        </div>
    );
}