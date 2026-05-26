import styles from './Footer.module.css';
import House from "../../assets/drhouse-circle.png";
import { Link } from "react-router-dom";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return(
        <footer className={styles.footer__container}>
            <div className={styles.footer__content}>
                <Link to="/" className={styles.footer__logo_link}>
                    <div className={styles.footer__logo_section}>
                        <img className={styles.footer__logo} src={House} alt="Dr House" />
                        <p className={styles.footer__logo_text}>The House™ of Dice</p>
                    </div>
                </Link>
                
                <nav className={styles.footer__nav}>
                    <Link to="/" className={styles.footer__link}>Home</Link>
                    <Link to="/about" className={styles.footer__link}>About</Link>
                    <Link to="/terms" className={styles.footer__link}>Terms</Link>
                    <Link to="/privacy" className={styles.footer__link}>Privacy</Link>
                </nav>

                <div className={styles.footer__info}>
                    <p className={styles.footer__copyright}>©{currentYear} IDG2100 - The Megaminds</p>
                </div>
            </div>
        </footer>
    );
}