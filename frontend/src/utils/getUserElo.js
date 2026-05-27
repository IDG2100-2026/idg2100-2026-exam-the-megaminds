export function getUserElo(user) {
    if (!user) return 0;
    return Number(user.eloRapid ?? user.eloBlitz ?? user.eloBullet ?? user.elo ?? 0);
}
