import { useState } from "react";
import styles from "./AdminDashBoard.module.css";

const MOCK_STATS = {
    ongoingGames: 4,
    activeUsersWeek: 17,
    recentGames: [
        { gameId: "game-abc123", rules: { bestof: 3 }, winnerId: 1001, updatedAt: new Date().toISOString() },
        { gameId: "game-def456", rules: { bestof: 5 }, winnerId: 1042, updatedAt: new Date().toISOString() },
    ]
};

const MOCK_USERS = [
    { userId: 1001, username: "drhouse",   email: "house@dice.com",  elo: 1400, banned: false, isAdmin: true,  emailVerified: true },
    { userId: 1042, username: "rollmaster", email: "roll@dice.com",  elo: 1120, banned: false, isAdmin: false, emailVerified: true },
    { userId: 1099, username: "badactor",   email: "bad@dice.com",   elo: 800,  banned: true,  isAdmin: false, emailVerified: true },
    { userId: 1100, username: "newbie99",   email: "new@dice.com",   elo: 1000, banned: false, isAdmin: false, emailVerified: false },
];

const MOCK_ERRORS = [
    { _id: "e1", type: "frontend", message: "Cannot read properties of undefined (reading 'userId')", url: "/game/abc123", userId: 1042, createdAt: new Date().toISOString() },
    { _id: "e2", type: "backend",  message: "Cast to ObjectId failed for value",                      url: "/api/games/bad-id", userId: null, createdAt: new Date().toISOString() },
];

export default function AdminDashBoard() {
    const [activeTab, setActiveTab] = useState("Overview");

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>Admin Dashboard</h1>
                    <p>Manage users, monitor activity, and review error logs</p>
                </div>
            </div>

            <div className={styles.tabs}>
                {["Overview", "Users", "Error Logs"].map(tab => (
                    <button
                        key={tab}
                        className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ""}`}
                        onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                ))}
            </div>

            {activeTab === "Overview" && <OverviewTab />}
            {activeTab === "Users" && <UsersTab />}
            {activeTab === "Error Logs" && <ErrorLogsTab />}
        </div>
    )
}

// Overview

function OverviewTab () {
    const { ongoingGames, activeUsersWeek, recentGames } = MOCK_STATS;

    return (
        <div className={styles.tabContent}>
            <div className={styles.statsRow}>
                <StatCard label="Ongoing Games"         value={ongoingGames} />
                <StatCard label="Active Users (7 days)" value={activeUsersWeek} />
                <StatCard label="Recent Games"          value={recentGames.length} sub="last 10 finished" />
            </div>

            <div className={styles.section}>
                <h2>Recent Finished Games</h2>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Game ID</th>
                            <th>Best Of</th>
                            <th>Winner ID</th>
                            <th>Finished</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentGames.map(game => (
                            <tr key={game.gameId}>
                                <td className={styles.mono}>{game.gameId}</td>
                                <td>{game.rules?.bestof}</td>
                                <td>{game.winnerId ?? "-"}</td>
                                <td className ={styles.dim}>{new Date(game.updatedAt).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// Users

function UsersTab() {
    const [search, setSearch] = useState("");

    const filtered = MOCK_USERS.filter(u =>
        u.username.includes(search.toLowerCase()) ||
        u.email.includes(search.toLowerCase())
    );

    return (
        <div className={styles.tabContent}>
            <div className={styles.toolbar}>
                <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="Search by ussername or email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Elo</th>
                        <th>Status</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map(u => (
                        <tr key={u.userId}>
                            <td className={styles.mono}>{u.username}</td>
                            <td className={styles.dim}>{u.email}</td>
                            <td>{u.elo}</td>
                            <td>
                                {u.banned
                                ? <span className={styles.badgeBanned}>Banned</span>
                                : <span className={styles.badgeActive}>Active</span>
                            }
                            {!u.emailVerified &&
                            <span className={styles.badgePending}>Unverified</span>
                            }
                        </td>
                        <td>
                            {u.isAdmin
                                ? <span className={styles.badgeAdmin}>Admin</span>
                                : <span className={styles.badgeUser}>User</span>
                            }
                        </td>
                        <td className={styles.actions}>
                            {u.banned
                                ? <button className={styles.btnSuccess}>Unban</button>
                                : <button className={styles.btnWarn}>Ban</button>
                                }
                                {u.isAdmin
                                    ? <button className={styles.btnSecondary}>Demote</button>
                                    : <button className={styles.btnSecondary}>Make Admin</button>
                                }
                                <button className={styles.btnDanger}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className={styles.pagination}>
                <button className={styles.pageBtn} disabled>← Prev</button>
                <span className={styles.pageInfo}>Page 1</span>
                <button className={styles.pageBtn} disabled>Next →</button>
            </div>
        </div>
    )
}


// Error Logs

function ErrorLogsTab() {
    return (
        <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
                <h2>Error Logs</h2>
                <span className={styles.totalCount}>{MOCK_ERRORS.length} total</span>
            </div>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Message</th>
                        <th>URL</th>
                        <th>User</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    {MOCK_ERRORS.map(log => (
                        <tr key={log._id}>
                            <td>
                                <span className={log.type === "backend" ? styles.badgeBanned : styles.badgePending}>
                                    {log.type}
                                </span>
                            </td>
                            <td className={styles.errorMsg} title={log.message}>
                                {log.message.length > 80 ? log.message.slice(0, 80) + "…" : log.message}
                            </td>
                            <td className={styles.dim}>{log.url ?? "-"}</td>
                            <td className={styles.dim}>{log.userId ?? "anon"}</td>
                            <td className={styles.dim}>{new Date(log.createdAt).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            <div className={styles.pagination}>
                <button className={styles.pageBtn} disabled>← Prev</button>
                <span className={styles.pageInfo}>Page 1</span>
                <button className={styles.pageBtn} disabled>Next →</button>
            </div>
        </div>
    );
}

// Shared

function StatCard({ label, value, sub}) {
    return (
        <div className={styles.statCard}>
            <div className={styles.statValue}>{value ?? "-"}</div>
            <div className={styles.statLabel}>{label}</div>
            {sub && <div className={styles.statSub}>{sub}</div>}
        </div>
    );
}