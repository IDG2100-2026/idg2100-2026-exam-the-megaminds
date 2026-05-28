import { User } from "../models/users.js";
import { Game } from "../models/games.js";
import { hashPwd } from "../utils/hash.js";
import crypto from 'crypto';
import { sendVerificationEmail, sendPasswordResetEmail } from './email.service.js';

const ALLOWED_USER_SORT_FIELDS = ["elo", "username", "totalGames", "wins", "losses", "age"];

//Pagination
export async function getAllUsers({ sort = "elo", limit = 10, page = 1, search, username }) {
    const skip = (page - 1) * limit;
    const sortField = ALLOWED_USER_SORT_FIELDS.includes(sort) ? sort : "elo";
    // Build filter query — supports free-text search across username/email, or exact username match
    const query = {};
    if (search) {
        // Escape regex special characters to prevent Regular expression denial of service
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        query.$or = [
            { username: { $regex: escaped, $options: "i" } },
            { email: { $regex: escaped, $options: "i" } }
        ];
    }
    if (username) {
        const escaped = username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        query.username = { $regex: escaped, $options: "i" };
    }
    return User.find(query)
        .sort({ [sortField]: -1 })
        .limit(Number(limit))
        .skip(Number(skip))
        .select("-pwd");
}

// the select("-pwd") makes sure the password is not displayed even though it is hashed
export async function getUserById(userId) {
    const user = await User.findOne({ userId: userId }).select("-pwd");
    if (!user) return null;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const winsLastMonth = await Game.countDocuments({
        winnerId: userId,
        status: "finished",
        createdAt: { $gte: thirtyDaysAgo }
    });

    const lossesLastMonth = await Game.countDocuments({
        "players.userId": userId,
        status: "finished",
        winnerId: { $ne: userId },
        createdAt: { $gte: thirtyDaysAgo }
    });

    return { ...user.toObject(), winsLastMonth, lossesLastMonth };
}

export async function createUser(data) {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    const user = await User.create({
        ...data,
        verificationToken: token,
        verificationTokenExpires: expires
    });

    await sendVerificationEmail(user.email, token);

    const userObj = user.toObject();
    delete userObj.pwd;
    return userObj;
}

export async function updateUser(userId, data) {
    if (data.pwd) {
        data.pwd = hashPwd(data.pwd);
    }
    return User.findOneAndUpdate(
        { userId: userId },
        data,
        { returnDocument: "after" }
    ).select("-pwd");
}

export async function deleteUser(userId) {
    return User.findOneAndDelete({ userId: userId }).select("-pwd");
}

//Pagination
export async function getUserGames(userId, { limit = 10, page = 1 }) {
    const skip = (page - 1) * limit;
    return Game.find({ "players.userId": userId })
        .limit(Number(limit))
        .skip(Number(skip))
        .sort({ createdAt: -1 });
}

// Set banned flag to true — banned users are excluded from matchmaking
export async function banUser(userId) {
    return User.findOneAndUpdate(
        { userId: userId },
        { banned: true },
        { returnDocument: "after" }
    ).select("-pwd");
}

// Remove ban from a user
export async function unbanUser(userId) {
    return User.findOneAndUpdate(
        { userId: userId },
        { banned: false },
        { returnDocument: "after" }
    ).select("-pwd");
}

export async function verifyEmail(token) {
    const user = await User.findOne({
        verificationToken: token,
        verificationTokenExpires: { $gt: new Date() }
    });
    if(!user) return null;

    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();
    return user;
}

export async function resendVerification(email) {
    const user = await User.findOne({ email, emailVerified: false });
    if (!user) return null;

    const token = crypto.randomBytes(32).toString('hex');
    user.verificationToken = token;
    user.verificationTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    try {
        await sendVerificationEmail(email, token);
    } catch (err) {
        console.error('[resendVerification] email send failed:', err.message);
        return false;
    }
    return true;
}

export async function requestPasswordReset(email) {
    const user = await User.findOne({ email, emailVerified: true });
    if (!user) return null;

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    await sendPasswordResetEmail(email, token);
    return true;
}

export async function resetPassword(token, newPwd) {
    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() }
    });
    if (!user) return null;

    await User.updateOne(
        { _id: user._id },
        {
            $set: { pwd: hashPwd(newPwd) },
            $unset: { resetPasswordToken: '', resetPasswordExpires: '' }
        }
    );
    return true;
}

export default {
    getAllUsers,
    getUserById,
    getUserGames,
    createUser,
    deleteUser,
    updateUser,
    banUser,
    unbanUser,
    verifyEmail,
    resendVerification,
    requestPasswordReset,
    resetPassword
};