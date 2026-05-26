import { userService } from '@/services/api';

export async function enrichPlayers(gamePlayers = []) {
    return Promise.all(
        gamePlayers.map(async (p) => {
            if (typeof p.userId !== 'number') {
                return { ...p, username: 'Anonymous', elo: null, profilePicture: null };
            }
            try {
                const user = await userService.getUser(p.userId);
                return { ...p, username: user.username, elo: user.elo ?? null, profilePicture: user.profilePicture ?? null };
            } catch {
                return { ...p, username: 'Unknown', elo: null, profilePicture: null };
            }
        })
    );
}

export async function enrichGames(gamesList) {
    return Promise.all(
        gamesList.map(async (game) => {
            const players = await enrichPlayers(game.players || []);
            return { ...game, players };
        })
    );
}
