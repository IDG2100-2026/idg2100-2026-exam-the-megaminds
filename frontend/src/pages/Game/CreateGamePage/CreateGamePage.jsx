import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppContext } from '@/context/AppContext';
import { gameService } from '@/services/api';
import styles from './CreateGamePage.module.css';

const BESTOF_OPTIONS = [3, 5, 7];
const ROUND_TIME_OPTIONS = [
    { value: 10, label: 'Bullet - 10s' },
    { value: 30, label: 'Blitz - 30s' },
    { value: 90, label: 'Rapid - 90s' },
];
const NUM_PLAYERS_OPTIONS = [2, 3, 5];
const BUYIN_OPTIONS = [1, 10, 50];

export default function CreateGamePage() {
    const navigate = useNavigate();
    const { user } = useAppContext();
    
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        bestof: 3,
        straightallowed: true,
        roundTime: 30,
        numPlayers: 2,
        buyIn: 1,
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : Number(value),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) { navigate('/login'); return; }
        setError('');
        setLoading(true);
        try {
            const gameId = crypto.randomUUID();
            await gameService.createGame({
                gameId,
                rules: {
                    bestof: form.bestof,
                    straightallowed: form.straightallowed,
                    roundTime: form.roundTime,
                    numPlayers: form.numPlayers,
                    buyIn: form.buyIn,
                },
                players: [{ userId: user.userId }],
            });
            navigate(`/game/${gameId}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Create a Game</h1>
            <form className={styles.form} onSubmit={handleSubmit}>

                <div className={styles.field}>
                    <span className={styles.label}>Best of</span>
                    <div className={styles.options}>
                        {BESTOF_OPTIONS.map(n => (
                            <label key={n} className={`${styles.option} ${form.bestof === n ? styles.selected : ''}`}>
                                <input type="radio" name="bestof" value={n} checked={form.bestof === n} onChange={handleChange} />
                                Best of {n}
                            </label>
                        ))}
                    </div>
                </div>

                <div className={styles.field}>
                    <span className={styles.label}>Time Control</span>
                    <div className={styles.options}>
                        {ROUND_TIME_OPTIONS.map(({ value, label }) => (
                            <label key={value} className={`${styles.option} ${form.roundTime === value ? styles.selected : ''}`}>
                                <input type="radio" name="roundTime" value={value} checked={form.roundTime === value} onChange={handleChange} />
                                {label}
                            </label>
                        ))}
                    </div>
                </div>

                <div className={styles.field}>
                    <span className={styles.label}>Number of Players</span>
                    <div className={styles.options}>
                        {NUM_PLAYERS_OPTIONS.map(n => (
                            <label key={n} className={`${styles.option} ${form.numPlayers === n ? styles.selected : ''}`}>
                                <input type="radio" name="numPlayers" value={n} checked={form.numPlayers === n} onChange={handleChange} />
                                {n} players
                            </label>
                        ))}
                    </div>
                </div>

                <div className={styles.field}>
                    <span className={styles.label}>Buy-in</span>
                    <div className={styles.options}>
                        {BUYIN_OPTIONS.map(n => (
                            <label key={n} className={`${styles.option} ${form.buyIn === n ? styles.selected : ''}`}>
                                <input type="radio" name="buyIn" value={n} checked={form.buyIn === n} onChange={handleChange} />
                                {n} pts
                            </label>
                        ))}
                    </div>
                </div>

                <div className={styles.field}>
                    <label className={styles.checkboxLabel}>
                        <input type="checkbox" name="straightallowed" checked={form.straightallowed} onChange={handleChange} />
                        Allow straight hands
                    </label>
                </div>

                {error && <p className={styles.error}>{error}</p>}

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                    {loading ? 'Creating…' : 'Create Game'}
                </button>
            </form>
        </div>
    );
}