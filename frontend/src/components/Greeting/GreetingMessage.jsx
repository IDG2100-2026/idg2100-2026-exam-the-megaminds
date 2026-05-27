import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import ProfilePicPlaceholder from "../../assets/profile-pic-placeholder.svg";
import styles from '@/components/Greeting/GreetingMessage.module.css';

export default function GreetingComponent() {
    const { user, isAnonymous, logout } = useAppContext();
    const navigate = useNavigate();

    // Get profile picture URL
    const profilePicUrl = user?.profilePicture 
    ? `http://localhost:8476${user.profilePicture}`
    : ProfilePicPlaceholder;

    // Registered User View
    if (user && !isAnonymous) {
        return (
            <div className={styles.greetingContainer}>
                <div className={styles.registeredUser}>
                    <div className={styles.greetingText}>
                        <span className={styles.hello}>Hello,</span>
                        <span className={styles.username}>{user.username}</span>
                    </div>

                    <Link to="/profile" className={styles.profileIcon}>
                        <img
                            src={profilePicUrl}
                            alt={user.username}
                            className={styles.profileImage}
                            title="View Profile"
                        />
                    </Link>

                    {user.role === "admin" && (
                        <Link to="/admin" className={styles.adminLink}>
                            Admin
                        </Link>
                    )}

                    <button
                    className={styles.logoutBtn}
                    onClick={() => {
                        logout();
                        navigate("/");
                    }}
                >
                    Logout
                </button>
            </div>
        </div>
        );
    }

    // Anonymous User View
    if (isAnonymous) {
        return (
            <div className={styles.greetingContainer}>
                <div className={styles.anynmousUser}>
                    <span className={styles.guestText}>PLaying as Guest</span>
                    <button 
                        className={styles.logoutBtn}
                        onClick={() => {
                            logout();
                            navigate('/')
                        }}
                    >
                        Exit 
                    </button>
                </div>
            </div>
        )
    }

    // Not logged In View
    return (
        <div className={styles.greetingContainer}>
            <div className={styles.notLoggedIn}>
                <Link to="/login" className={styles.loginLink}>Login</Link>
                <span className={styles.separator}>•</span>
                <Link to="/register" className={styles.registerLink}>Register</Link>
            </div>
        </div>
    );
}