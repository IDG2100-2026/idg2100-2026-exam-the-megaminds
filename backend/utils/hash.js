import crypto from "node:crypto";

const { APP_SALT: salt } = process.env;

export function hashPwd(pwd) {
    const s2hash = pwd + salt;
    return crypto.createHash("sha256").update(s2hash).digest("hex");
}

export default function checkPwd(pwd, existingHash) {
    return hashPwd(pwd) === existingHash;
}

export function hashToken(token){
    return crypto.createHash("sha256").update(token + salt).digest("hex");
}
