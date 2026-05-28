const API_URL = import.meta.env.VITE_API_URL;

// Central fetch wrapper — all requests go through here.
// credentials: 'include' ensures the httpOnly JWT cookie is sent on every request.
// Throws on non-2xx responses, formatting validation errors when available.
const apiCall = async (method, endpoint, body = null) => {
    const options = {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
        // express-validator errors: { errors: [{ msg, path, ... }] }
        if (data.errors && Array.isArray(data.errors)) {
            throw new Error(data.errors.map(e => e.msg).join(', '));
        }
        if (data.details && Array.isArray(data.details)) {
            const errorMessages = data.details.map(e => `${e.field}: ${e.message}`).join(', ');
            throw new Error(errorMessages);
        }
        throw new Error(data.message || data.error || 'API Error');
    }
    return data;
};

// Auth & user management
// login/logout/getMe rely on the httpOnly cookie set by the backend — no token handling needed here
export const userService = {
    // Returns the currently logged-in user based on the JWT cookie
    getMe: () =>
        apiCall('GET', '/api/users/me').then(res => res.user),

    // Backend sets httpOnly cookie on success
    login: (username, pwd) =>
        apiCall('POST', '/api/login', { username, pwd }).then(res => res.user),

    // Backend clears the cookie
    logout: () =>
        apiCall('POST', '/api/logout'),

    register: (username, email, pwd, age) =>
        apiCall('POST', '/api/users', { username, email, pwd, age }).then(res => res.user),

    verifyEmail: (code) =>
        apiCall('GET', `/api/verify-email?code=${code}`),

    resendVerification: (email) =>
        apiCall('POST', '/api/resend-verification', { email }),

    forgotPassword: (email) =>
        apiCall('POST', '/api/forgot-password', { email }),
    
    getUser: (userId) =>
        apiCall('GET', `/api/users/${userId}`).then(res => res.data),

    getAllUsers: (page = 1, limit = 20, search = '') => {
        const params = new URLSearchParams({ page, limit });
        if (search) params.set('search', search);
        return apiCall('GET', `/api/users?${params}`).then(res => res.data);
    },

    updateUser: (userId, updates) =>
        apiCall('PATCH', `/api/users/${userId}`, updates).then(res => res.data),

    deleteUser: (userId) =>
        apiCall('DELETE', `/api/users/${userId}`),
};

// Game CRUD and state transitions
export const gameService = {
    getAllGames: (page = 1, limit = 20) =>
        apiCall('GET', `/api/games?page=${page}&limit=${limit}`).then(res => res.data),

    getGame: (gameId) =>
        apiCall('GET', `/api/games/${gameId}`),

    createGame: (gameData) =>
        apiCall('POST', '/api/games', gameData),

    // Updates game phase (e.g. waiting → in-progress → complete)
    updateGameStatus: (gameId, status) =>
        apiCall('PATCH', `/api/games/${gameId}/status`, { status }),

    // Records final result and triggers ELO update
    recordResult: (gameId, resultData) =>
        apiCall('PATCH', `/api/games/${gameId}/result`, resultData),
};

// Matchmaking queue — pairs registered or anonymous users into a game
export const matchmakingService = {
    joinQueue: (queueData) =>
        apiCall('POST', '/api/matchmaking/queue', queueData),

    joinQueueAnonymous: (queueData) =>
        apiCall('POST', '/api/matchmaking/queue/anonymous', queueData),

    leaveQueue: (userId) =>
        apiCall('DELETE', `/api/matchmaking/queue/${userId}`),
};

// Tournament management (reading is public; mutations require auth)
export const tournamentService = {
    // Accepts { status, sort, sortOrder, page, limit }; empty/undefined values are dropped.
    // status can be comma-separated, e.g. "pending,in-progress".
    getTournaments: (params = {}) => {
        const query = new URLSearchParams(
            Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
        ).toString();
        return apiCall('GET', `/api/tournaments${query ? `?${query}` : ''}`);
    },

    getTournament: (tournamentId) =>
        apiCall('GET', `/api/tournaments/${tournamentId}`),

    createTournament: (data) =>
        apiCall('POST', '/api/tournaments', data),

    updateTournament: (tournamentId, updates) =>
        apiCall('PATCH', `/api/tournaments/${tournamentId}`, updates),

    deleteTournament: (tournamentId) =>
        apiCall('DELETE', `/api/tournaments/${tournamentId}`),

    // Backend route is /participants and expects userId in the body
    joinTournament: (tournamentId, userId) =>
        apiCall('POST', `/api/tournaments/${tournamentId}/participants`, { userId }),

    // For leave, userId goes in the URL
    leaveTournament: (tournamentId, userId) =>
        apiCall('DELETE', `/api/tournaments/${tournamentId}/participants/${userId}`),

    startTournament: (tournamentId) =>
        apiCall('POST', `/api/tournaments/${tournamentId}/rounds`),

    advanceRound: (tournamentId) =>
        apiCall('POST', `/api/tournaments/${tournamentId}/rounds/next`),

    awardWinner: (tournamentId, winnerId) =>
        apiCall('PATCH', `/api/tournaments/${tournamentId}/winner`, { winnerId }),
};

// Comments are scoped to either a game or a tournament
export const commentService = {
    getGameComments: (gameId) =>
        apiCall('GET', `/api/games/${gameId}/comments`),

    getTournamentComments: (tournamentId) =>
        apiCall('GET', `/api/tournaments/${tournamentId}/comments`),

    addGameComment: (gameId, text) =>
        apiCall('POST', `/api/games/${gameId}/comments`, { text }),

    addTournamentComment: (tournamentId, text) =>
        apiCall('POST', `/api/tournaments/${tournamentId}/comments`, { text }),

    // Admin only
    deleteComment: (commentId) =>
        apiCall('DELETE', `/api/comments/${commentId}`),
};

export const leaderboardService = {
    getLeaderboard: (page = 1, limit = 20) =>
        apiCall('GET', `/api/leaderboard?page=${page}&limit=${limit}`),
};

// Platform-wide stats for the admin dashboard and homepage preview
export const platformService = {
    getActivity: () =>
        apiCall('GET', '/api/platform/activity'),
};

// Admin-only actions
export const adminService = {
    banUser: (userId) =>
        apiCall('PATCH', `/api/users/${userId}/ban`),

    unbanUser: (userId) =>
        apiCall('PATCH', `/api/users/${userId}/unban`),

    setUserRole: (userId, isAdmin) =>
        apiCall('PATCH', `/api/users/${userId}/role`, { isAdmin }),

    getErrorLogs: (page = 1, limit = 50) =>
        apiCall('GET', `/api/errors?page=${page}&limit=${limit}`),

    logError: (errorData) =>
        apiCall('POST', '/api/errors', errorData).catch(() => {}),

    deleteGame: (gameId) =>
        apiCall('DELETE', `/api/games/${gameId}`),

    getAllComments: (page = 1, limit = 20, search = "") => 
        apiCall('GET', `/api/comments?page=${page}&limit=${limit}&order=desc${search ? `&search=${encodeURIComponent(search)}`: ""}`),

    }

