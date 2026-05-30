import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import styles from "./AdminLayout.module.css";

export default function AdminLayout() {
    const { user, isInitialized, logout } = useAppContext();
    const navigate = useNavigate()


    useEffect(() => {
        if (isInitialized && (!user || user.role !== "admin")) {
            navigate("/");
        }
    }, [user, isInitialized, navigate]);

    if (!isInitialized || !user || user.role !== "admin") return null;

    const linkClass = ({ isActive }) =>
        isActive ? `${styles.adminLink} ${styles.active}` : styles.adminLink;

    return (
        <>
            <div className={styles.adminBanner}>
                <span className={styles.adminBadge}>Admin</span>
                <nav className={styles.adminNav}>
                    <NavLink to="/admin" end className={linkClass}>Dashboard</NavLink>
                    <NavLink to="/admin/tournament/new" className={linkClass}>New Tournament</NavLink>
                    <NavLink to="/" className={linkClass}>Back to Website</NavLink>
                    <button
                    className={styles.adminLink}
                    onClick={() =>{
                        logout();
                        navigate("/");
                    }}>Logout</button>
                    </nav>
                </div>
                <Outlet />
                </>
    );
}