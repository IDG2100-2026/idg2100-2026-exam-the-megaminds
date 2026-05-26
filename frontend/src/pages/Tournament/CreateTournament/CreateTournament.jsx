import {useParams, useNavigate } from "react-router";
import { useAppContext } from "@/context/AppContext";
import {useTournament} from "@/hooks/useTournament";
import { tournamentService } from "@/services/api";
import TournamentForm from "@/components/TournamentForm/TournamentForm";
import styles from "./CreateTournament.module.css";

function toLocaleInput(iso){
    if (!iso) return "";
    const d = new Date(iso);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
}

export default function CreateTournamentPage() {
    const {tournamentid} = useParams();
    const isEdit = Boolean(tournamentid);
    const navigate = useNavigate();
    const { user } = useAppContext();

    const { tournament, loading, error } = useTournament(tournamentid);

    
    if (isEdit && loading) return <p className={styles.status}>Loading…</p>;
    if (isEdit && error) return <p className={styles.status}>Error: {error}</p>;

    const initialValues = isEdit && tournament ? {
        tournamentId: tournament.tournamentId,
        title: tournament.title,
        description: tournament.description,
        format: tournament.format,
        minPlayers: tournament.minPlayers,
        maxPlayers: tournament.maxPlayers,
        startDate: toLocaleInput(tournament.startDate),
        trophy: tournament.trophy ?? { title: "", imageUrl: "" },
    } : undefined;

    async function handleSubmit(data) {
        if (isEdit) {
            await tournamentService.updateTournament(tournamentid, data);
            navigate(`/tournament/${tournamentid}`);
        } else {
            const res = await tournamentService.createTournament({ ...data, createdBy: user.userId });
            navigate(`/tournament/${res.data.tournamentId}`);
        }
    }

    return(
        <main className={styles.page}>
            <h1 className={styles.title}>{isEdit ? "Edit tournament" : "Create tournament"}</h1>
            <TournamentForm
                initialValues={initialValues}
                onSubmit={handleSubmit}
                submitLabel={isEdit ? "Save changes" : "Create tournament"}
            />
        </main>
    );
}