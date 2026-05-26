import {NavLink, Link} from "react-router-dom";
import House from "../../assets/drhouse-circle.png";
import {useState} from "react"
import styles from './Header.module.css';
import GreetingMessage from "@/components/Greeting/GreetingMessage"
export default function Header() {
     const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            </nav>
             <div className={styles.header__profile}>
                <GreetingMessage />
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
                </nav>
            )}
        </header>
    );
}