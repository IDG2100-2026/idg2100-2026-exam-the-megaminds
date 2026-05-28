import RefreshSession from "../models/refreshSession.js";
import { generateRefreshToken, hashToken, refreshExpiryDate } from "../middleware/jwt.js";

export async function issueRefreshSession(userId, userAgent){
    const rawToken = generateRefreshToken();
    await RefreshSession.create({
        tokenHash: hashToken(rawToken),
        userId,
        userAgent,
        expiresAt: refreshExpiryDate()
    });
    return rawToken;
}

// Validates + rotates: deletes the presented token, issues a new one. Returns { userId, rawToken } or null.
export async function rotateRefreshSession(rawToken, userAgent) {
    if (!rawToken) return null;
    const session = await RefreshSession.findOne({ tokenHash: hashToken(rawToken) });
    if (!session || session.expiresAt < new Date()) return null;

    await session.deleteOne(); // single-use: the old token can never be replayed
    const newRaw = await issueRefreshSession(session.userId, userAgent);
    return { userId: session.userId, rawToken: newRaw };
}

export async function revokeRefreshSession(rawToken) {
    if (!rawToken) return;
    await RefreshSession.deleteOne({ tokenHash: hashToken(rawToken)});
    
}