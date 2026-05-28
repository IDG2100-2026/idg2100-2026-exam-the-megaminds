import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAppContext } from '@/context/AppContext';
import { userService, leaderboardService } from '@/services/api';
import placeholderAvatar from '@/assets/profile-pic-placeholder.svg';
import styles from './ProfilePage.module.css';

const GAMES_PER_PAGE = 5;

export default function ProfilePage() {
    const navigate = useNavigate();
    const { user, isInitialized, refreshUser } = useAppContext();

    const [profile, setProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [rank, setRank] = useState(null);

    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState({ email: "", aboutMe: "", pwd: "", confirm: "" });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [editError, setEditError] = useState("");
    const [editLoading, setEditLoading] = useState(false);
    const [showPwd, setShowPwd] = useState(false);

    const [games, setGames] = useState([]);
    const [gamesPage, setGamesPage] = useState(1);
    const [hasMoreGames, setHasMoreGames] = useState(true);
    const [loadingGames, setLoadingGames] = useState(false);

    useEffect(() => {
        if (isInitialized && !user) navigate("/login");
    }, [isInitialized, user, navigate]);

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            try {
                const data = await userService.getUser(user.userId);
                setProfile(data);
                setEditForm({ email: data.email || "", aboutMe: data.aboutMe || "", pwd: "", confirm: "" });
            } catch {
                // failed to load
            } finally {
                setLoadingProfile(false);
            }
        };
        load();
    }, [user]);

    useEffect(() => {
        if (!user) return;
        loadGames(1, true);
        leaderboardService.getLeaderboard(1, 100)
            .then(res => {
                const list = Array.isArray(res.data) ? res.data : [];
                const idx = list.findIndex(u => u.userId === user.userId);
                if (idx >= 0) setRank(idx + 1);
            })
            .catch(() => {});
    }, [user]);

    const loadGames = async (page, reset = false) => {
        setLoadingGames(true);
        try {
            const data = await userService.getUserGames(user.userId, page, GAMES_PER_PAGE);
            const list = Array.isArray(data) ? data : [];
            setGames(prev => reset ? list : [...prev, ...list]);
            setHasMoreGames(list.length === GAMES_PER_PAGE);
            setGamesPage(page);
        } catch {
            // failed to load games
        } finally {
            setLoadingGames(false);
        }
    };

    const handleLoadMore = () => loadGames(gamesPage + 1);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleEditSave = async (e) => {
        e.preventDefault();
        setEditError("");

        if (editForm.pwd && editForm.pwd !== editForm.confirm) {
            setEditError("Passwords do not match");
            return;
        }

        setEditLoading(true);
        try {
            if (avatarFile) {
                await userService.uploadAvatar(user.userId, avatarFile);
            }
            const updates = { email: editForm.email, aboutMe: editForm.aboutMe };
            if (editForm.pwd) updates.pwd = editForm.pwd;
            await userService.updateUser(user.userId, updates);
            const refreshed = await userService.getUser(user.userId);
            setProfile(refreshed);
            setAvatarFile(null);
            setAvatarPreview(null);
            setEditMode(false);
            await refreshUser();
        } catch (err) {
            setEditError(err.message);
        } finally {
            setEditLoading(false);
        }
    };

    if (!isInitialized || loadingProfile) {
        return <div className={styles.page}><p className={styles.loading}>Loading profile...</p></div>;
    }

    if (!profile) {
        return <div className={styles.page}><p className={styles.loading}>Profile not found.</p></div>;
    }

    const avatarSrc = profile.profilePicture || placeholderAvatar;
    const isAdmin = user?.role === "admin";

    return (
        <div className={styles.page}>

            {/* header */}
            <section className={styles.header}>
                <img 
                    src={avatarSrc}
                    alt={`${profile.username}'s avatar`}
                    className={styles.avatar}
                    onError={(e) => { e.target.src = placeholderAvatar; }}
                />
                <div className={styles.headerInfo}>
                    <h1 className={styles.username}>{profile.username}</h1>
                    {isAdmin && <span className={styles.adminBadge}>Admin</span>}
                    {rank && <p className={styles.rankBadge}>Rank #{rank} on Leaderboard</p>}
                    {(user?.userId === profile.userId || isAdmin) && (
                        <p className={styles.email}>{profile.email}</p>
                    )}
                    {profile.aboutMe && !editMode && (
                        <p className={styles.aboutMe}>{profile.aboutMe}</p>
                    )}
                    {!editMode && (
                        <button className={styles.editBtn} onClick={() => setEditMode(true)}>
                            Edit Profile
                        </button>
                    )}
                </div>
            </section>

            {/* Edit profile form */}
            {editMode && (
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Edit Profile</h2>
                    <form className={styles.form} onSubmit={handleEditSave} noValidate>
                        
                        <div className={styles.field}>
                            <label className={styles.label}>Profile Picture</label>
                            <div className={styles.avatarUpload}>
                                <img
                                    src={avatarPreview || profile.profilePicture || placeholderAvatar}
                                    alt='preview'
                                    className={styles.avatarPreview}
                                />
                                <label className={styles.uploadLabel}>
                                    Choose image
                                    <input
                                        type='file'
                                        accept='image/jpeg,image/png,image/webp'
                                        className={styles.fileInput}
                                        onChange={handleAvatarChange}
                                    />
                                </label>
                                {avatarFile && <span className={styles.fileName}>{avatarFile.name}</span>}
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label} htmlFor='edit-email'>Email</label>
                            <input
                                id='edit-email'
                                className={styles.input}
                                type='email'
                                value={editForm.email}
                                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value}))}
                                autoComplete='email'
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="edit-about">About me</label>
                            <textarea
                                id="edit-about"
                                className={styles.textarea}
                                value={editForm.aboutMe}
                                onChange={(e) => setEditForm(prev => ({ ...prev, aboutMe: e.target.value }))}
                                rows={3}
                                maxLength={300}
                                placeholder="Tell us a bit about yourself…"
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="edit-pwd">New password</label>
                            <div className={styles.inputWrapper}>
                                <input
                                    id="edit-pwd"
                                    className={styles.input}
                                    type={showPwd ? 'text' : 'password'}
                                    value={editForm.pwd}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, pwd: e.target.value }))}
                                    autoComplete="new-password"
                                    placeholder="Leave blank to keep current password"
                                />
                                <button type="button" className={styles.revealBtn} onClick={() => setShowPwd(v => !v)}>
                                    {showPwd ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>

                        {editForm.pwd && (
                            <div className={styles.field}>
                                <label className={styles.label} htmlFor="edit-confirm-pwd">Confirm new password</label>
                                <input
                                    id="edit-confirm-pwd"
                                    className={styles.input}
                                    type={showPwd ? 'text' : 'password'}
                                    value={editForm.confirm}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, confirm: e.target.value }))}
                                    autoComplete="new-password"
                                    placeholder="Repeat your new password"
                                />
                            </div>
                        )}

                        {editError && <p className={styles.error}>{editError}</p>}

                        <div className={styles.btnRow}>
                            <button type="submit" className={styles.saveBtn} disabled={editLoading}>
                                {editLoading ? 'Saving…' : 'Save changes'}
                            </button>
                            <button
                                type="button"
                                className={styles.cancelBtn}
                                onClick={() => { setEditMode(false); setAvatarFile(null); setAvatarPreview(null); setEditError(''); setEditForm(prev => ({ ...prev, pwd: '', confirm: '' })); }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </section>
            )}

            {/* Stats */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Stats</h2>
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{profile.eloRapid ?? 1000}</span>
                        <span className={styles.statLabel}>Rapid Elo (90s)</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{profile.eloBlitz ?? 1000}</span>
                        <span className={styles.statLabel}>Blitz Elo (30s)</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{profile.eloBullet ?? 1000}</span>
                        <span className={styles.statLabel}>Bullet Elo (10s)</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{profile.totalGames ?? 0}</span>
                        <span className={styles.statLabel}>Total games</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{profile.wins ?? 0}</span>
                        <span className={styles.statLabel}>All-time wins</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{profile.losses ?? 0}</span>
                        <span className={styles.statLabel}>All-time losses</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{profile.winsLastMonth ?? 0}</span>
                        <span className={styles.statLabel}>Wins (30 days)</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{profile.lossesLastMonth ?? 0}</span>
                        <span className={styles.statLabel}>Losses (30 days)</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>
                            {(profile.eloChangeLastWeek ?? 0) >= 0 ? '+' : ''}{profile.eloChangeLastWeek ?? 0}
                        </span>
                        <span className={styles.statLabel}>Elo change (week)</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{profile.points ?? 1000}</span>
                        <span className={styles.statLabel}>Points balance</span>
                    </div>
                </div>
            </section>

            {/* Trophies */}
            {profile.trophies?.length > 0 && (
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Trophies & Achievements</h2>
                    <div className={styles.trophiesGrid}>
                        {profile.trophies.map((trophy, idx) => (
                            <div key={idx} className={styles.trophy}>
                                <span className={styles.trophyIcon}>🏅</span>
                                <p className={styles.trophyTitle}>{trophy.title}</p>
                                <p className={styles.trophyDate}>{new Date(trophy.awardedAt).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Recent games */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Recent games</h2>
                {games.length === 0 && !loadingGames && (
                    <p className={styles.empty}>No games Played yet.</p>
                )}
                <ul className={styles.gamesList}>
                    {games.map((game) => {
                        const isFinished = game.status === 'finished';
                        const isWinner = game.winnerId === user.userId;
                        const resultClass = !isFinished ? styles.ongoing : isWinner ? styles.win : styles.loss;
                        const resultLabel = !isFinished ? game.status : isWinner ? 'Win' : 'Loss';
                        return (
                            <li
                                key={game.gameId}
                                className={styles.gameRow}
                                onClick={() => navigate(`/game/${game.gameId}`)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={e => e.key === 'Enter' && navigate(`/game/${game.gameId}`)}
                            >
                                <span className={`${styles.resultBadge} ${resultClass}`}>{resultLabel}</span>
                                <span className={styles.gameId}>#{game.gameId?.slice(-6) ?? '------'}</span>
                                <span className={styles.gameMeta}>
                                    Best of {game.rules?.bestof} · {game.rules?.roundTime}s
                                </span>
                                <span className={styles.gameDate}>
                                    {new Date(game.createdAt).toLocaleDateString()}
                                </span>
                            </li>
                        );
                    })}
                </ul>
                {hasMoreGames && (
                    <button className={styles.loadMoreBtn} onClick={handleLoadMore} disabled={loadingGames}>
                        {loadingGames ? 'Loading…' : 'Load more'}
                    </button>
                )}
            </section>
        </div>
    );
}