const API_URL = import.meta.env.VITE_API_URL;

const AUTH_FREE = ['/api/login', '/api/refresh', '/api/logout'];

let refreshPromise = null;
const doRefresh = () => {
    if (!refreshPromise) {
        refreshPromise = fetch(`${API_URL}/api/refresh`, { method: 'POST', credentials: 'include' })
            .then(r => r.ok)
            .finally(() => { refreshPromise = null; });
    }
    return refreshPromise;
};

const apiCall = async (method, endpoint, body = null, _retried = false) => {
    const options = { method, credentials: 'include', headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${API_URL}${endpoint}`, options);

    if (response.status === 401 && !_retried && !AUTH_FREE.includes(endpoint)) {
        if (await doRefresh()) return apiCall(method, endpoint, body, true);
    }

    const data = await response.json();
    if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) throw new Error(data.errors.map(e => e.msg).join(', '));
        if (data.details && Array.isArray(data.details)) throw new Error(data.details.map(e => `${e.field}: ${e.message}`).join(', '));
        throw new Error(data.message || data.error || 'API Error');
    }
    return data;
};

export const userService = {

    getMe: () =>
        apiCall('GET', '/api/users/me').then(res => res.user),

    login: (username, pwd) =>
        apiCall('POST', '/api/login', { username, pwd }).then(res => res.user),

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

    resetPassword: (code, pwd) =>
        apiCall('POST', '/api/reset-password', { code, pwd }),
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
    getUserGames: (userId, page = 1, limit = 5) =>
        apiCall('GET', `/api/users/${userId}/games?page=${page}&limit=${limit}`).then(res => res.data),

    uploadAvatar: async (userId, file) => {
        const formData = new FormData();
        formData.append('avatar', file);
        const response = await fetch(`${API_URL}/api/users/${userId}/avatar`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Upload failed');
        return data;
    },
};

export const gameService = {
    getAllGames: (page = 1, limit = 20, status) =>
        apiCall('GET', `/api/games?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`).then(res => res.data),

    getGame: (gameId) =>
        apiCall('GET', `/api/games/${gameId}`),

    createGame: (gameData) =>
        apiCall('POST', '/api/games', gameData),

    updateGameStatus: (gameId, status) =>
        apiCall('PATCH', `/api/games/${gameId}/status`, { status }),

    recordResult: (gameId, resultData) =>
        apiCall('PATCH', `/api/games/${gameId}/result`, resultData),

    joinGame: (gameId) =>
        apiCall('POST', `/api/games/${gameId}/join`),
};

export const matchmakingService = {
    joinQueue: (queueData) =>
        apiCall('POST', '/api/matchmaking/queue', queueData),

    joinQueueAnonymous: (queueData) =>
        apiCall('POST', '/api/matchmaking/queue/anonymous', queueData),

    leaveQueue: (userId) =>
        apiCall('DELETE', `/api/matchmaking/queue/${userId}`),
};

export const tournamentService = {

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

    joinTournament: (tournamentId, userId) =>
        apiCall('POST', `/api/tournaments/${tournamentId}/participants`, { userId }),

    leaveTournament: (tournamentId, userId) =>
        apiCall('DELETE', `/api/tournaments/${tournamentId}/participants/${userId}`),

    startTournament: (tournamentId) =>
        apiCall('POST', `/api/tournaments/${tournamentId}/rounds`),

    advanceRound: (tournamentId) =>
        apiCall('POST', `/api/tournaments/${tournamentId}/rounds/next`),

    awardWinner: (tournamentId, winnerId) =>
        apiCall('PATCH', `/api/tournaments/${tournamentId}/winner`, { winnerId }),

    getStandings: (tournamentId) =>
        apiCall('GET', `/api/tournaments/${tournamentId}/standings`),

    getGames: (tournamentId) =>
        apiCall('GET', `/api/tournaments/${tournamentId}/games`),

    uploadTrophyImage: async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        const response = await fetch(`${API_URL}/api/tournaments/trophy-image`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Upload failed');
        return data.imageUrl;
    },

};

export const commentService = {
    getGameComments: (gameId) =>
        apiCall('GET', `/api/games/${gameId}/comments`),

    getTournamentComments: (tournamentId) =>
        apiCall('GET', `/api/tournaments/${tournamentId}/comments`),

    addGameComment: (gameId, text) =>
        apiCall('POST', `/api/games/${gameId}/comments`, { text }),

    addTournamentComment: (tournamentId, text) =>
        apiCall('POST', `/api/tournaments/${tournamentId}/comments`, { text }),

    deleteComment: (commentId) =>
        apiCall('DELETE', `/api/comments/${commentId}`),
};

export const leaderboardService = {
    getLeaderboard: (page = 1, limit = 20) =>
        apiCall('GET', `/api/leaderboard?page=${page}&limit=${limit}`),
};

export const platformService = {
    getActivity: () =>
        apiCall('GET', '/api/platform/activity').then(res => res.data),
};

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

    getDashboard: () =>
        apiCall('GET', '/api/admin/dashboard').then(res => res.data),
    }
