import { useState } from "react";
import {Link} from "react-router-dom"
import {useAppContext} from "@/context/AppContext";
import {tournamentService} from "@/services/api";
import styles from "./JoinLeaveButton.module.css";

export default function JoinLeaveButton({tournament, onChange}) {
    const {user} = useAppContext();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    if(!user){
        return <Link to="/login" className={styles.note}>Log in to Join</Link>
    }

    const {tournamentId, status, participants = [] } = tournament;
    const isParticipant = participants.includes(user.userId);
    const canJoin = status === "pending";

    async function handleClick() {
        setBusy(true);
        setError(null);
        try {
            if(isParticipant){
                await tournamentService.leaveTournament(tournamentId, user.userId);
            } else {
                await tournamentService.joinTournament(tournamentId, user.userId);
            } 
            onChange?.();    
        } catch (err){
            setError(err.message);
        } finally {
            setBusy(false);
        }
        
    }
    if (!isParticipant && !canJoin){
        return <p className={styles.note}>Registration is closed.</p>;
    }

    return (
        <div className={styles.wrap}>
            <button
                className={`${styles.btn} ${isParticipant ? styles.leave : styles.join}`}
                onClick={handleClick}
                disabled={busy}
            > {busy ? "…" : isParticipant ? "Leave tournament" : "Join tournament"}
            </button>
            {error && <p className={styles.error}>{error}</p>}
        </div>
    );
}