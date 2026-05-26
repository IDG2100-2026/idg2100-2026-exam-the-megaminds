import { useState } from "react";
import styles from "./TournamentForm.module.css";

const EMPTY = {
    title: "",
    description: "",
    format: { bestof: 5, straightallowed: true, roundTime: 10 },
    minPlayers: 2,
    maxPlayers: 8,
    startDate: "",
    buyIn: 0,
    eloRange: { min: "", max: "" },   // "" = open on that side
    trophy: { title: "", imageUrl: "" },
};


export default function TournamentForm({ initialValues, onSubmit, submitLabel = "Create tournament" }) {
    const [values, setValues] = useState(() => {
        const merged = { ...EMPTY, ...initialValues };
        return {
            ...merged,
            buyIn: merged.buyIn ?? 0,
            eloRange: {
                min: merged.eloRange?.min ?? "",
                max: merged.eloRange?.max ?? "",
            },
        };
    });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    // Update a top-level field
    const set = (field) => (e) =>
        setValues((v) => ({ ...v, [field]: e.target.value }));

    // Update a nested field inside `format` or `trophy`
    const setNested = (group, field, parse = (x) => x) => (e) =>
        setValues((v) => ({ ...v, [group]: { ...v[group], [field]: parse(e.target.value) } }));

    async function handleSubmit(e) {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            await onSubmit({
                ...values,
                minPlayers: Number(values.minPlayers),
                maxPlayers: Number(values.maxPlayers),
                buyIn: Number(values.buyIn) || 0,
                eloRange: {
                    min: values.eloRange.min === "" ? null : Number(values.eloRange.min),
                    max: values.eloRange.max === "" ? null : Number(values.eloRange.max),
                },
                startDate: new Date(values.startDate).toISOString(),
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
                <span>Title</span>
                <input value={values.title} onChange={set("title")} required minLength={3} maxLength={100} />
            </label>

            <label className={styles.field}>
                <span>Description</span>
                <textarea value={values.description} onChange={set("description")} required minLength={10} maxLength={500} rows={4} />
            </label>

            <div className={styles.row}>
                <label className={styles.field}>
                    <span>Best of</span>
                    <select value={values.format.bestof} onChange={setNested("format", "bestof", Number)}>
                        <option value={3}>3</option>
                        <option value={5}>5</option>
                        <option value={7}>7</option>
                    </select>
                </label>

                <label className={styles.field}>
                    <span>Round time (s)</span>
                    <select value={values.format.roundTime} onChange={setNested("format", "roundTime", Number)}>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                    </select>
                </label>

                <label className={styles.checkbox}>
                    <input
                        type="checkbox"
                        checked={values.format.straightallowed}
                        onChange={(e) => setValues((v) => ({ ...v, format: { ...v.format, straightallowed: e.target.checked } }))}
                    />
                    <span>Straights allowed</span>
                </label>
            </div>

            <div className={styles.row}>
                <label className={styles.field}>
                    <span>Min players</span>
                    <input type="number" min={2} value={values.minPlayers} onChange={set("minPlayers")} required />
                </label>
                <label className={styles.field}>
                    <span>Max players</span>
                    <input type="number" min={2} value={values.maxPlayers} onChange={set("maxPlayers")} required />
                </label>
            </div>
            <div className={styles.row}>
                <label className={styles.field}>
                    <span>Buy-in (points to enter)</span>
                    <input type="number" min={0} value={values.buyIn} onChange={set("buyIn")} />
                </label>
                <label className={styles.field}>
                    <span>Min Elo (blank = open)</span>
                    <input type="number" min={0} value={values.eloRange.min} onChange={setNested("eloRange", "min")} />
                </label>
                <label className={styles.field}>
                    <span>Max Elo (blank = open)</span>
                    <input type="number" min={0} value={values.eloRange.max} onChange={setNested("eloRange", "max")} />
                </label>
            </div>

            <label className={styles.field}>
                <span>Start date</span>
                <input type="datetime-local" value={values.startDate} onChange={set("startDate")} required />
            </label>

            <div className={styles.row}>
                <label className={styles.field}>
                    <span>Trophy title</span>
                    <input value={values.trophy.title} onChange={setNested("trophy", "title")} required minLength={2} maxLength={100} />
                </label>
                <label className={styles.field}>
                    <span>Trophy image URL (optional)</span>
                    <input value={values.trophy.imageUrl} onChange={setNested("trophy", "imageUrl")} />
                </label>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.submit} disabled={busy}>
                {busy ? "Saving…" : submitLabel}
            </button>
        </form>
    );
}
