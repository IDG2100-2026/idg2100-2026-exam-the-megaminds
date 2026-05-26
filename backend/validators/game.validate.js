import { param, body } from "express-validator";
import Game from "../models/games.js";
import User from "../models/users.js";
import {
    GAME_BESTOF_OPTIONS,
    GAME_ROUND_TIME_OPTIONS,
    GAME_STATUSES,
    GAME_PLAYERS_PER_MATCH
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
        
        body("players")
            .isArray({ min: GAME_PLAYERS_PER_MATCH, max: GAME_PLAYERS_PER_MATCH })
            .withMessage(`A game must have exactly ${GAME_PLAYERS_PER_MATCH} players`)
            .bail()
            // DB check — confirm both players exist, and that they are not the same person
            .custom(async (players) => {
                for (const player of players) {
                    const user = await User.findOne({ userId: player.userId });
                    if (!user) {
                        throw new Error(`User with ID ${player.userId} does not exist`);
                    }
                }
                if (players[0].userId === players[1].userId) {
                    throw new Error("A player cannot play against themselves");
                }
            })
    ];
}

export function validateGameResult(){
    return [
        body("winnerId")
            .isInt({ min: 0, max: Number.MAX_SAFE_INTEGER })
            .withMessage("Winner ID must be a valid integer")
            .bail()
            // DB check — confirm the winner user exists
            .custom(async (winnerId) => {
                const user = await User.findOne({ userId: winnerId });
                if (!user) {
                    throw new Error("Winner user does not exist");
                }
            }),
        
        body("loserId")
            .isInt({ min: 0, max: Number.MAX_SAFE_INTEGER })
            .withMessage("Loser ID must be a valid integer")
            .bail()
            // DB check — confirm the loser user exists
            .custom(async (loserId) => {
                const user = await User.findOne({ userId: loserId });
                if (!user) {
                    throw new Error("Loser user does not exist");
                }
            }),

        body("loserScore")
            .optional()
            .isInt({ min: 0 })
            .withMessage("Loser score must be a positive integer"),
        
        body("winnerScore")
            .optional()
            .isInt({ min: 0 })
            .withMessage("Winner score must be a positive integer")
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