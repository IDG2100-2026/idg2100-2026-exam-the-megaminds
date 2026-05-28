import {NavLink, Link} from "react-router-dom";
import House from "../../assets/drhouse-circle.png";
import {useState, useRef, useEffect} from "react"
import styles from './Header.module.css';
import GreetingMessage from "@/components/Greeting/GreetingMessage"
import { useAppContext } from "@/context/AppContext";
import SettingsPanel from './SettingsPanel';

export default function Header() {
    const { user } = useAppContext();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const settingsRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (settingsRef.current && !settingsRef.current.contains(e.target)) {
                setSettingsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navLinkClass = ({ isActive }) =>
        isActive ? `${styles.navLink} ${styles.active}` : styles.navLink;

    const handleNavClick = () => {
        setMobileMenuOpen(false);
    };
    return (
        <header className={styles.header__container}>
            <Link to="/" className={styles.header__logo_link}>
                <div className={styles.header__logo_container}>
                    <img className={styles.header__logo} src={House} alt="Dr House" />
                    <p className={styles.header__logo_text}>The House™ of Dice</p>
                </div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className={styles.header__nav}>
                <NavLink to="/" className={navLinkClass}>Home</NavLink>
                <NavLink to="/lobby" className={navLinkClass}>Lobby</NavLink>
                <NavLink to="/tournament" className={navLinkClass}>Tournament</NavLink>
                <NavLink to="/leaderboard" className={navLinkClass}>Leaderboard</NavLink>
                <NavLink to="/about" className={navLinkClass}>About</NavLink>
                {user?.isAdmin && (
                    <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>
                )}
            </nav>

            <div className={styles.header__profile}>
                <GreetingMessage />
            </div>

            <div className={styles.settingsWrapper} ref={settingsRef}>
                <button
                    className={`${styles.settingsBtn} ${settingsOpen ? styles.settingsBtnActive : ''}`}
                    onClick={() => setSettingsOpen(prev => !prev)}
                    aria-label="Settings"
                >
                    &#9881;
                </button>
                {settingsOpen && <SettingsPanel />}
            </div>

            {/* Mobile Hamburger Menu */}
            <button 
                className={`${styles.hamburger} ${mobileMenuOpen ? styles.active : ''}`}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
            >
                <span></span>
                <span></span>
                <span></span>
            </button>
            {mobileMenuOpen && (
                <nav className={styles.mobile__menu}>
                    <NavLink to="/" className={navLinkClass} onClick={handleNavClick}>Home</NavLink>
                    <NavLink to="/lobby" className={navLinkClass} onClick={handleNavClick}>Lobby</NavLink>
                    <NavLink to="/leaderboard" className={navLinkClass} onClick={handleNavClick}>Leaderboard</NavLink>
                    <NavLink to="/tournament" className={navLinkClass}>Tournament</NavLink>
                    <NavLink to="/about" className={navLinkClass} onClick={handleNavClick}>About</NavLink>
                    {user?.isAdmin && (
                        <NavLink to="/admin" className={navLinkClass} onClick={handleNavClick}>Admin</NavLink>
                    )}
                </nav>
            )}
        </header>
    );
}