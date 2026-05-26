import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAppContext } from '@/context/AppContext';
import { userService } from '@/services/api';
import placeholderAvatar from '@/assets/profile-pic-placeholder.svg';
import styles from './ProfilePage.module.css';

const GAMES_PER_PAGE = 5;

export default function ProfilePage() {
    const navigate = useNavigate();
    const { user, isInitialized, refreshUser } = useAppContext();

    const [profile, setProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState({ email: "", aboutMe: "" });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [editError, setEditError] = useState("");
    const [editLoading, setEditLoading] = useState(false);

    const [pwdOpen, setPwdOpen] = useState(false);
    const [pwdForm, setPwdForm] = useState({ pwd: "", confirm: "" });
    const [pwdError, setPwdError] = useState("");
    const [pwdSuccess, setPwdSuccess] = useState(false);
    const [pwdLoading, setPwdLoading] = useState(false);
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
                setEditForm({ email: data.email || "", aboutMe: data.aboutMe || "" });
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
        setEditLoading(true);
        try {
            if (avatarFile) {
                await userService.uploadAvatar(user.userId, avatarFile);
            }
            await userService.updateUser(user.userId, {
                email: editForm.email,
                aboutMe: editForm.aboutMe,
            });
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

    const handlePwdSave = async (e) => {
        e.preventDefault();
        setPwdError("");
        if (pwdForm.pwd !== pwdForm.confirm) {
            setPwdError("Passwords do not match");
            return;
        }
        setPwdLoading(true);
        try {
            await userService.updateUser(user.userId, { pwd: pwdForm.pwd });
            setPwdSuccess(true);
            setPwdForm({ pwd: "", confirm: "" });
            setPwdOpen(false);
        } catch (err) {
            setPwdError(err.message);
        } finally {
            setPwdLoading(false);
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
                        
                    </form>
                </section>
            )}
        </div>
    )
}