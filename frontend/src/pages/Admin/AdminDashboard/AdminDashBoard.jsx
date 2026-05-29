import { useState, useEffect } from "react";
import {
  userService,
  adminService,
  commentService,
  gameService,
} from "@/services/api";
import styles from "./AdminDashBoard.module.css";

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
        {["Overview", "Users", "Error Logs", "Comments", "Games"].map((tab) => (
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
      {activeTab === "Comments" && <CommentsTab />}
      {activeTab === "Games" && <GamesTab />}
    </div>
  );
}

// Overview

function OverviewTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminService
      .getDashboard()
      .then((res) => setData(res))
      .catch(() => setError("Failed to load dashboard data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>Loading stats...</div>;
  if (error) return <div className={styles.errorBox}>{error}</div>;

  const {activity, incidents, recentIncidents, newProfilesLastWeek } = data;

  return (
    <div className={styles.tabContent}>
      <div className={styles.statsRow}>
        <StatCard label="Ongoing Games" value={activity.ongoingGames} />
        <StatCard label="Available Games" value={activity.activeGames} />
        <StatCard label="Played Games (7 days)" value={activity.playedGamesWeek}></StatCard>
        <StatCard
          label="Active Users (7 days)"
          value={activity.activeUsersWeek}
        />
        <StatCard label="New Profiles (7 Days)" value={newProfilesLastWeek}/>
        <StatCard label="IP-Change Incidents" value={incidents["ip-change"]}/>
        <StatCard label="Rate-Limit Incidents" value={incidents["rate-limit"]}/>
      </div>

      <div className={styles.section}>
        <h2>Recent Security Incidents</h2>
        {recentIncidents.length === 0 ? (
          <p className={styles.dim}>No Incidents</p>
        ) : (
          <table className={styles.table}>
          
            <thead>
              <tr>
                <th>Type</th><th>User</th><th>IP</th><th>User Agent</th><th>Path</th><th>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentIncidents.map((inc) => (
                <tr key={inc._id}>
                  <td>
                    <span className={inc.type === "ip-change" ? styles.badgePending : styles.badgeBanned}>
                      {inc.type}
                    </span>
                  </td>
                  <td className={styles.dim}>{inc.userId ?? "anon"}</td>
                  <td className={styles.mono}>{inc.ip ?? "—"}</td>
                  <td className={styles.dim} title={inc.userAgent}>
                    {inc.userAgent?.length > 40 ? inc.userAgent.slice(0, 40) + "..." : (inc.userAgent ?? "-")}
                  </td>
                  <td className={styles.mono}>{inc.path ?? "-"}</td>
                  <td className={styles.dim}>{new Date(inc.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
       <div className={styles.section}>
        <h2>Recent Finished Games</h2>
        {activity.recentGames?.length === 0 ? (
          <p className={styles.dim}>No finished games yet</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Game / Tournament ID</th>
                <th>Best of</th>
                <th>Winner</th>
                <th>Finished</th>
              </tr>
            </thead>
            <tbody>
              {activity.recentGames?.map((game) => (
                <tr key={game.gameId}>
                  <td className={styles.mono}>{game.gameId}</td>
                  <td>{game.rules?.bestof}</td>
                  <td>{game.winnerName ?? "—"}</td>
                  <td className={styles.dim}>{new Date(game.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Users

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [msg, setMsg] = useState({ text: "", isError: false });
  const [refreshKey, setRefreshKey] = useState(0);
  const LIMIT = 20;

  const showMsg = (text, isError = false) => {
    setMsg({ text, isError });
    setTimeout(() => setMsg({ text: "", isError: false }), 3000);
  };

  const refetch = () => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  };

  useEffect(() => {
    userService
      .getAllUsers(page, LIMIT, search)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setUsers(list);
        setHasMore(list.length === LIMIT);
      })
      .catch(() => showMsg("Failed to load users", true))
      .finally(() => setLoading(false));
  }, [page, search, refreshKey]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleBan = async (userId) => {
    try {
      await adminService.banUser(userId);
      showMsg(`User ${userId} banned`);
      refetch();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  const handleUnban = async (userId) => {
    try {
      await adminService.unbanUser(userId);
      showMsg(`User ${userId} unbanned`);
      refetch();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  const handleSetRole = async (userId, makeAdmin) => {
    try {
      await adminService.setUserRole(userId, makeAdmin);
      showMsg(`User ${userId} ${makeAdmin ? "promoted to admin" : "demoted"}`);
      refetch();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`Delete user "${username}"? This cannot be undone.`))
      return;
    try {
      await userService.deleteUser(userId);
      showMsg(`User "${username}" deleted`);
      refetch();
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  return (
    <div className={styles.tabContent}>
      {msg.text && (
        <div
          className={`${styles.actionMsg} ${msg.isError ? styles.actionError : styles.actionSuccess}`}
        >
          {msg.text}
        </div>
      )}

      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search by username or email..."
          value={search}
          onChange={handleSearch}
        />
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>Loading users...</div>
        ) : users.length === 0 ? (
          <div className={styles.empty}>No users found</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>ELO</th>
                <th>Status</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.userId}>
                  <td className={styles.mono}>{u.username}</td>
                  <td className={styles.dim}>{u.email}</td>
                  <td>{u.elo}</td>
                  <td>
                    {u.banned ? (
                      <span className={styles.badgeBanned}>Banned</span>
                    ) : (
                      <span className={styles.badgeActive}>Active</span>
                    )}
                    {!u.emailVerified && (
                      <span className={styles.badgePending}>Unverified</span>
                    )}
                  </td>
                  <td>
                    {u.isAdmin ? (
                      <span className={styles.badgeAdmin}>Admin</span>
                    ) : (
                      <span className={styles.badgeUser}>User</span>
                    )}
                  </td>
                  <td className={styles.actions}>
                    {u.banned ? (
                      <button
                        className={styles.btnSuccess}
                        onClick={() => handleUnban(u.userId)}
                      >
                        Unban
                      </button>
                    ) : (
                      <button
                        className={styles.btnWarn}
                        onClick={() => handleBan(u.userId)}
                      >
                        Ban
                      </button>
                    )}
                    {u.isAdmin ? (
                      <button
                        className={styles.btnSecondary}
                        onClick={() => handleSetRole(u.userId, false)}
                      >
                        Demote
                      </button>
                    ) : (
                      <button
                        className={styles.btnSecondary}
                        onClick={() => handleSetRole(u.userId, true)}
                      >
                        Make Admin
                      </button>
                    )}
                    <button
                      className={styles.btnDanger}
                      onClick={() => handleDelete(u.userId, u.username)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.pagination}>
        <button
          className={styles.pageBtn}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          ← Prev
        </button>
        <span className={styles.pageInfo}>Page {page}</span>
        <button
          className={styles.pageBtn}
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasMore}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// Error Logs

function ErrorLogsTab() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const LIMIT = 50;

  useEffect(() => {
    adminService
      .getErrorLogs(page, LIMIT)
      .then((res) => {
        setLogs(res.data || []);
        setTotal(res.total || 0);
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [page]);

  const hasMore = page * LIMIT < total;

  return (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <h2>Error Logs</h2>
        <span className={styles.totalCount}>{total} total</span>
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className={styles.empty}>No errors logged yet</div>
        ) : (
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
              {logs.map((log) => (
                <tr key={log._id}>
                  <td>
                    <span
                      className={
                        log.type === "backend"
                          ? styles.badgeBanned
                          : styles.badgePending
                      }
                    >
                      {log.type}
                    </span>
                  </td>
                  <td className={styles.errorMsg} title={log.message}>
                    {log.message.length > 80
                      ? log.message.slice(0, 80) + "…"
                      : log.message}
                  </td>
                  <td className={styles.dim}>{log.url ?? "—"}</td>
                  <td className={styles.dim}>{log.userId ?? "anon"}</td>
                  <td className={styles.dim}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.pagination}>
        <button
          className={styles.pageBtn}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          ← Prev
        </button>
        <span className={styles.pageInfo}>
          Page {page} — {total} logs
        </span>
        <button
          className={styles.pageBtn}
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasMore}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// Games

function GamesTab() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [msg, setMsg] = useState({ text: "", isError: false });
  const [refreshKey, setRefreshKey] = useState(0);
  const LIMIT = 20;

  const showMsg = (text, isError = false) => {
    setMsg({ text, isError });
    setTimeout(() => setMsg({ text: "", isError: false }), 3000);
  };

  useEffect(() => {
    gameService
      .getAllGames(page, LIMIT)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setGames(list);
        setHasMore(list.length === LIMIT);
      })
      .catch(() => showMsg("Failed to load games", true))
      .finally(() => setLoading(false));
  }, [page, refreshKey]);

  const handleDelete = async (gameId) => {
    if (!window.confirm(`Delete game "${gameId}"? This cannot be undone.`))
      return;
    try {
      await adminService.deleteGame(gameId);
      showMsg(`Game "${gameId}" deleted`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  return (
    <div className={styles.tabContent}>
      {msg.text && (
        <div
          className={`${styles.actionMsg} ${msg.isError ? styles.actionError : styles.actionSuccess}`}
        >
          {msg.text}
        </div>
      )}

      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>Loading games...</div>
        ) : games.length === 0 ? (
          <div className={styles.empty}>No games found</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Game ID</th>
                <th>Status</th>
                <th>Best of</th>
                <th>Players</th>
                <th>Winner</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {games
                .filter((g) => g?.gameId)
                .map((g) => (
                  <tr key={g.gameId}>
                    <td className={styles.mono}>{g.gameId}</td>
                    <td>
                      <span
                        className={
                          g.status === "finished"
                            ? styles.badgeActive
                            : g.status === "active"
                              ? styles.badgeAdmin
                              : styles.badgePending
                        }
                      >
                        {g.status}
                      </span>
                    </td>
                    <td>{g.rules?.bestof}</td>
                    <td>{g.players?.length ?? 0}</td>
                    <td className={styles.dim}>{g.winnerName ?? "—"}</td>
                    <td className={styles.dim}>
                      {new Date(g.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <button
                        className={styles.btnDanger}
                        onClick={() => handleDelete(g.gameId)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.pagination}>
        <button
          className={styles.pageBtn}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          ← Prev
        </button>
        <span className={styles.pageInfo}>Page {page}</span>
        <button
          className={styles.pageBtn}
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasMore}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// Comments

function CommentsTab() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [msg, setMsg] = useState({ text: "", isError: false });
  const [refreshKey, setRefreshKey] = useState(0);
  const LIMIT = 20;

  const showMsg = (text, isError = false) => {
    setMsg({ text, isError });
    setTimeout(() => setMsg({ text: "", isError: false }), 3000);
  };

  useEffect(() => {
    adminService
      .getAllComments(page, LIMIT, search)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setComments(list);
        setHasMore(list.length === LIMIT);
      })
      .catch(() => showMsg("Failed to load comments", true))
      .finally(() => setLoading(false));
  }, [page, search, refreshKey]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm("Delete this comment? This cannot be undone.")) return;
    try {
      await commentService.deleteComment(commentId);
      showMsg("Comment deleted");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showMsg(err.message, true);
    }
  };

  return (
    <div className={styles.tabContent}>
      {msg.text && (
        <div
          className={`${styles.actionMsg} ${msg.isError ? styles.actionError : styles.actionSuccess}`}
        >
          {msg.text}
        </div>
      )}

      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search comment text..."
          value={search}
          onChange={handleSearch}
        />
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className={styles.empty}>No comments found</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Text</th>
                <th>Context</th>
                <th>User</th>
                <th>Posted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {comments.map((c) => (
                <tr key={c.commentId}>
                  <td className={styles.errorMsg} title={c.text}>
                    {c.text.length > 80 ? c.text.slice(0, 80) + "…" : c.text}
                  </td>
                  <td className={styles.mono}>
                    {c.gameId
                      ? `game: ${c.gameId}`
                      : `tournament: ${c.tournamentId}`}
                  </td>
                  <td className={styles.dim}>{c.userId}</td>
                  <td className={styles.dim}>
                    {new Date(c.createdAt).toLocaleString()}
                  </td>
                  <td>
                    <button
                      className={styles.btnDanger}
                      onClick={() => handleDelete(c.commentId)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.pagination}>
        <button
          className={styles.pageBtn}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          ← Prev
        </button>
        <span className={styles.pageInfo}>Page {page}</span>
        <button
          className={styles.pageBtn}
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasMore}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// Shared

function StatCard({ label, value, sub }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statValue}>{value ?? "-"}</div>
      <div className={styles.statLabel}>{label}</div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  );
}
