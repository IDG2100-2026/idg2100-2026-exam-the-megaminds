import { param, body } from "express-validator";
import Game from "../models/games.js";
import User from "../models/users.js";
import {
    GAME_BESTOF_OPTIONS,
    GAME_ROUND_TIME_OPTIONS,
    GAME_NUM_PLAYERS_OPTIONS,
    GAME_BUYIN_OPTIONS,
    GAME_STATUSES
} from "../configs/constants.js";

export function validateGameId(){
    return [
        param("gameId")
            .trim()
            // DB check — confirm a game with this ID exists
            .custom(async (gameId) => {
                const game = await Game.findOne({ gameId: gameId });
                if (!game) {
                    throw new Error("Game does not exist");
                }
            })
            .withMessage("Game does not exist")
    ];
}

export function validateGameCreate(){
    return [
        body("gameId")
            .trim()
            .notEmpty()
            .withMessage("Game ID is required")
            .bail()
            // DB check — make sure this gameId is not already taken
            .custom(async (gameId) => {
                const existing = await Game.findOne({ gameId });
                if (existing) {
                    throw new Error("Game ID already in use");
                }
            }),

        body("rules.bestof")
            .isInt()
            .isIn(GAME_BESTOF_OPTIONS)
            .withMessage(`Game variant 'bestof' must be one of: ${GAME_BESTOF_OPTIONS.join(", ")}`),

        
        body("rules.straightallowed")
            .isBoolean()
            .withMessage("'straightallowed' must be a boolean (true or false)"),
        
        body("rules.roundTime")
            .isInt()
            .isIn(GAME_ROUND_TIME_OPTIONS)
            .withMessage(`'roundTime' must be one of: ${GAME_ROUND_TIME_OPTIONS.join(", ")} seconds`),

        body("rules.numPlayers")
            .isInt()
            .isIn(GAME_NUM_PLAYERS_OPTIONS)
            .withMessage(`'numPlayers' must be one of: ${GAME_NUM_PLAYERS_OPTIONS.join(", ")}`),

        body("rules.buyIn")
            .isInt()
            .isIn(GAME_BUYIN_OPTIONS)
            .withMessage(`'buyIn' must be one of: ${GAME_BUYIN_OPTIONS.join(", ")}`),

        body("players")
            .isArray({ min: 1, max: 5 })
            .withMessage("A game must have between 1 and 5 players")
            .bail()
            .custom(async (players) => {
                const ids = players.map(p => p.userId);
                if (new Set(ids).size !== ids.length) {
                    throw new Error("A player cannot appear twice in the same game");
                }
                for (const player of players) {
                    const user = await User.findOne({ userId: player.userId });
                    if (!user) throw new Error(`User with ID ${player.userId} does not exist`);
                }
            })
    ];
}

export function validateGameResult(){
    return [
        body("players")
            .isArray({ min: 2 })
            .withMessage("players must be an array with at least 2 entries")
            .bail()
            .custom(async (players) => {
                for (const p of players) {
                    if (typeof p.userId !== "number") throw new Error("Each player must have a numeric userId");
                    if (typeof p.score !== "number" || p.score < 0) throw new Error("Each player must have a non-negative score");
                    const user = await User.findOne({ userId: p.userId });
                    if (!user) throw new Error(`User with ID ${p.userId} does not exist`);
                }
            }),

        body("roundTime")
            .isInt()
            .isIn(GAME_ROUND_TIME_OPTIONS)
            .withMessage(`roundTime must be one of: ${GAME_ROUND_TIME_OPTIONS.join(", ")}`)
    ];
}

export function validateGameStatusUpdate(){
    return [
        body("status")
            .trim()
            .isIn(GAME_STATUSES)
            .withMessage(`Game status must be one of: ${GAME_STATUSES.join(", ")}`)
    ];
}

export default {
    validateGameId,
    validateGameCreate,
    validateGameResult,
    validateGameStatusUpdate
};