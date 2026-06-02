import userService from "../services/users.service.js";
import { generateWsToken } from "../middleware/jwt.js";
import checkPwd from "../utils/hash.js";
import User from "../models/users.js";
import { signAccessToken, setAccessCookie, setRefreshCookie, clearAuthCookies } from "../middleware/jwt.js";
import { issueRefreshSession, rotateRefreshSession, revokeRefreshSession } from "../services/auth.service.js";

export async function login(req, res) {
    const { username, pwd } = req.body;

    const user = await User.findOne({ username });
    if (!user || !checkPwd(pwd, user.pwd)) {
        return res.status(401).json({ success: false, message: "Invalid username or password" });
    }
    if (user.banned) {
        return res.status(403).json({ success: false, message: "This account has been banned" });
    }
    if (!user.emailVerified) {
        return res.status(403).json({ success: false, message: "Please verify your email before logging in" });
    }

    const role = user.isAdmin ? "admin" : "registered";
    setAccessCookie(res, signAccessToken(user.userId, role, req.ip));
    setRefreshCookie(res, await issueRefreshSession(user.userId, req.get("user-agent")));

    res.json({ success: true, user: { userId: user.userId, username: user.username, elo: user.elo, role, profilePicture: user.profilePicture || null, preferences: user.preferences || {} } });
}
export async function refresh(req, res){
    const rotated = await rotateRefreshSession(req.cookies?.refreshToken, req.get("user-agent"));
    if (!rotated){

        return res.status(401).json({ success: false, message: "Session expired, please login again"});
    }

    const user = await User.findOne({ userId: rotated.userId });
    if (!user || user.banned) {
        await revokeRefreshSession(rotated.rawToken);
        clearAuthCookies(res);
        return res.status(401).json({ success: false, message: "Session is no longer valid"});
    }

    const role = user.isAdmin ? "admin" : "registered";
    setAccessCookie(res, signAccessToken(user.userId, role, req.ip));
    setRefreshCookie(res, rotated.rawToken);

    res.json({ success: true, user: { userId: user.userId, username: user.username, elo: user.elo, role}});
}

export async function logout(req, res) {
    await revokeRefreshSession(req.cookies?.refreshToken);
    clearAuthCookies(res);
    res.json({ success: true, message: "Logged out" });
}

export async function getWsToken(req, res) {
    if (!req.userId) return res.status(401).json({ message: "Not logged in" });
    const wsToken = generateWsToken(req.userId);
    res.json({ wsToken });
}

export async function getMe(req, res) {
    if (!req.userId) {
        return res.status(401).json({ success: false, message: "Not logged in" });
    }

    const user = await User.findOne({ userId: req.userId });
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user: { userId: user.userId, username: user.username, elo: user.elo, role: user.isAdmin ? "admin" : "registered", profilePicture: user.profilePicture || null, preferences: user.preferences || {} } });
}

export async function getAllUsers(req, res) {
    const users = await userService.getAllUsers(req.query);
    res.status(200).json({ success: true, data: users });
}

export async function getUserById(req, res) {
    const user = await userService.getUserById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ success: true, data: user });
}

export async function createUser(req, res) {
    const newUser = await userService.createUser(req.validData);
    res.status(201).json({ success: true, data: newUser });
}

export async function updateUser(req, res) {
    const updUser = await userService.updateUser(req.params.userId, req.validData);
    if (!updUser) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ success: true, data: updUser });
}

export async function deleteUser(req, res) {
    const delUser = await userService.deleteUser(req.params.userId);
    if (!delUser) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ success: true, message: "User deleted successfully" });
}

export async function getUserGames(req, res) {
    const games = await userService.getUserGames(req.params.userId, req.query);
    res.status(200).json({ success: true, data: games });
}

export async function verifyEmail(req, res) {
    const { code } = req.query;
    if (!code) return res.status(400).json({ success: false, message: 'Verification code is required' });

    const user = await userService.verifyEmail(code);
    if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
    }
    res.json({ success: true, message: 'Email verified successfully' });
}

export async function resendVerification(req, res) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'email is required' });

    const result = await userService.resendVerification(email);
    if (result === false) {
        return res.status(503).json({ success: false, message: 'Failed to send email. Please try again shortly.' });
    }

    res.json({ success: true, message: 'If an unverified account exists for that email, a new link has been sent' });

}

export async function forgotPassword(req, res) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    await userService.requestPasswordReset(email);

    res.json({ success: true, message: 'If a verified account exists for that email, a reset link has been sent' });
}

export async function resetPassword(req, res) {
    const { code, pwd } = req.body;
    if (!code || !pwd) return res.status(400).json({ success: false, message: 'Code and new password are required' });

    const result = await userService.resetPassword(code, pwd);
    if (!result) {
        return res.status(400).json({ success: false, message: 'Invalid or expired reset link' });
    }
    res.json({ success: true, message: 'Password reset successfully' });
}

export async function uploadUserAvatar(req, res) {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image file received'});

    const profilePicture = `/uploads/avatars/${req.file.filename}`;
    const updated = await userService.updateUser(req.params.userId, { profilePicture });
    if (!updated) return res.status(400).json({ success: false, message: 'User not found' });

    res.json({ success: true, profilePicture });
}

export default {
    login,
    logout,
    refresh,
    getMe,
    getAllUsers,
    getUserById,
    getUserGames,
    createUser,
    updateUser,
    deleteUser,
    getWsToken,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    uploadUserAvatar
};
