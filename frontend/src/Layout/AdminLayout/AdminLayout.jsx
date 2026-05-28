import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import styles from "./AdminLayout.module.css";

export default function AdminLayout() {
    const { user, isInitialized } = useAppContext();
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
            <Header />
            <div className={styles.adminBanner}>
                <span className={styles.adminBadge}>Admin Mode</span>
                <nav className={styles.adminNav}>
                    <NavLink to="/admin" end className={linkClass}>Dashboard</NavLink>
                    <NavLink to="/admin/tournament/new" className={linkClass}>New Tournament</NavLink>
                    </nav>
                </div>
                <Outlet />
                <Footer />
                </>
    );
}