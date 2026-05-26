import {Link} from 'react-router-dom';
import styles from "./notfound.module.css";
export default function NotFoundPage() {
    return (
        <>
        <div className={styles.notfound}>
            <h1>404 - Page Not Found</h1>
            <p className={styles.notfound__text}>Page doesn't exist</p>
            <Link to="/">Go Back to Home</Link>
        </div>
        
        </>
    );
}