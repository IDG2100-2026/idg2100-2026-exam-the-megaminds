import jwt from "jsonwebtoken";
import crypto from "crypto";
import {hashToken} from "../utils/hash.js";

const {
    ACCESS_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRES_IN = "15m",
    REFRESH_TOKEN_TTL_DAYS = "7",
} = process.env;

const REFRESH_MAX_AGE_MS = Number(REFRESH_TOKEN_TTL_DAYS) * 24 * 60 * 60 * 1000;
const ACCESS_MAX_AGE_MS = 15 * 60 * 1000;

export function signAccessToken(userId, role, ip){
    return jwt.sign({ userId, role, ip}, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN});
}

export function verifyAccessToken(token){
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
}

export function setAccessCookie(res, token){
    res.cookie("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: ACCESS_MAX_AGE_MS
    });
}

export function generateRefreshToken() {
    return crypto.randomBytes(40).toString("hex");
}

export function refreshExpiryDate(){
    return new Date(Date.now() + REFRESH_MAX_AGE_MS);
}

export function setRefreshCookie(res, rawToken){
    res.cookie("refreshToken", rawToken,{
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: REFRESH_MAX_AGE_MS
    });
}

export function clearAuthCookies(res){
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
}
// In-memory store for short-lived WebSocket tokens: token → { userId, expiresAt }
const wsTokenStore = new Map();

// Generates a one time token for WebSocket aut, valid for 10 seconds
export function generateWsToken(userId){
    const token = crypto.randomBytes(32).toString("hex");
    wsTokenStore.set(token, { userId, expiresAt: Date.now() + 10_000 });
    return token;
}

// Validates and consumes a wsToken - returns userId or null if invalid/expired
export function consumeWsToken(token) {
    const entry = wsTokenStore.get(token);
    if (!entry) return null;
    wsTokenStore.delete(token); // one-time use
    if (Date.now() > entry.expiresAt) return null;
    return entry.userId;
}

export {hashToken}; 