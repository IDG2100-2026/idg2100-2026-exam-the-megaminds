import { param, body, query } from "express-validator";
import Tournament from "../models/tournaments.js";
import User from "../models/users.js";
import {
    GAME_BESTOF_OPTIONS,
    GAME_ROUND_TIME_OPTIONS,
    TOURNAMENT_STATUSES,
    MIN_TOURNAMENT_TITLE_LENGTH,
    MAX_TOURNAMENT_TITLE_LENGTH,
    MIN_TOURNAMENT_DESC_LENGTH,
    MIN_PAGINATION_LIMIT,
    MAX_PAGINATION_LIMIT,
    MAX_TOURNAMENT_DESC_LENGTH,
    MIN_TOURNAMENT_PLAYERS,
    MIN_TROPHY_TITLE_LENGTH,
    MAX_TROPHY_TITLE_LENGTH
} from "../configs/constants.js";

export function validateTournamentId(){
    return [
        param("tournamentId")
            .trim()
            .bail()
            .custom(async (tournamentId) => {
                const tournament = await Tournament.findOne({ tournamentId });
                if (!tournament) {
                    throw new Error("Tournament does not exist");
                }
            })
    ];
}

export function validateTournamentCreate(){
    return [

        body("title")
            .trim()
            .isLength({ min: MIN_TOURNAMENT_TITLE_LENGTH, max: MAX_TOURNAMENT_TITLE_LENGTH })
            .withMessage(`Tournament title must be between ${MIN_TOURNAMENT_TITLE_LENGTH} and ${MAX_TOURNAMENT_TITLE_LENGTH} characters`),

        body("description")
            .trim()
            .isLength({ min: MIN_TOURNAMENT_DESC_LENGTH, max: MAX_TOURNAMENT_DESC_LENGTH })
            .withMessage(`Tournament description must be between ${MIN_TOURNAMENT_DESC_LENGTH} and ${MAX_TOURNAMENT_DESC_LENGTH} characters`),

        body("format.bestof")
            .isIn(GAME_BESTOF_OPTIONS)
            .withMessage(`Tournament format 'bestof' must be one of: ${GAME_BESTOF_OPTIONS.join(", ")}`),

        body("format.straightallowed")
            .isBoolean()
            .withMessage("Format 'straightallowed' must be a boolean"),

        body("format.roundTime")
            .isInt({ min: 1 })
            .isIn(GAME_ROUND_TIME_OPTIONS)
            .withMessage(`Format 'roundTime' must be one of: ${GAME_ROUND_TIME_OPTIONS.join(", ")} seconds`),

        body("minPlayers")
            .isInt({ min: MIN_TOURNAMENT_PLAYERS, max: 1000 })
            .withMessage(`Minimum players must be at least ${MIN_TOURNAMENT_PLAYERS}`),

        body("maxPlayers")
            .isInt({ min: MIN_TOURNAMENT_PLAYERS, max: 10000 })
            .withMessage(`Maximum players must be at least ${MIN_TOURNAMENT_PLAYERS}`),

        body("buyIn")
            .optional()
            .isInt({ min: 0 })
            .withMessage("Buy-in must be a non-negative integer"),

        body("eloRange.min")
            .optional({ nullable: true })
            .isInt({ min: 0 })
            .withMessage("Elo minimum must be a non-negative integer"),

        body("eloRange.max")
            .optional({ nullable: true })
            .isInt({ min: 0 })
            .withMessage("Elo maximum must be a non-negative integer")
            .bail()
            .custom((max, { req }) => {
                const min = req.body.eloRange?.min;
                if (min != null && max != null && Number(max) < Number(min)) {
                    throw new Error("Elo maximum must be greater than or equal to Elo minimum");
                }
                return true;
            }),

        body("startDate")
            .isISO8601()
            .withMessage("Start date must be a valid ISO 8601 date"),

        body("trophy.title")
            .trim()
            .isLength({ min: MIN_TROPHY_TITLE_LENGTH, max: MAX_TROPHY_TITLE_LENGTH })
            .withMessage(`Trophy title must be between ${MIN_TROPHY_TITLE_LENGTH} and ${MAX_TROPHY_TITLE_LENGTH} characters`),

        body("trophy.imageUrl")
            .optional({ checkFalsy: true })
            .trim()
            .custom((val) => {

                if (val.startsWith("/uploads/")) return true;
                if (/^https?:\/\/.+/i.test(val)) return true;
                throw new Error("Trophy image must be an uploaded image or a valid http(s) URL");
            }),

        body("createdBy")
            .isInt({ min: 0, max: Number.MAX_SAFE_INTEGER })
            .withMessage("createdBy must be a valid user ID")
            .bail()
            .custom(async (userId) => {
                const user = await User.findOne({ userId });
                if (!user) throw new Error("createdBy user does not exist");
            })
    ];
}

export function validateTournamentJoin(){
    return [
        param("tournamentId"),
        body("userId")
            .isInt({ min: 0, max: Number.MAX_SAFE_INTEGER })
            .withMessage("User ID must be a valid integer")
            .bail()
            .custom(async (userId) => {
                const user = await User.findOne({ userId });
                if (!user) {
                    throw new Error("User does not exist");
                }
            })
    ];
}

export function validateTournamentLeave(){
    return [
        param("tournamentId").trim(),
        param("userId")
            .isInt({min: 0, max: Number.MAX_SAFE_INTEGER})
            .withMessage("User ID must be valid integer")
            .toInt()
    ];
}

export function validateTournamentUpdate(){
    return [
        body("title")
            .optional().trim()
            .isLength({ min: MIN_TOURNAMENT_TITLE_LENGTH, max: MAX_TOURNAMENT_TITLE_LENGTH })
            .withMessage(`Tournament title must be between ${MIN_TOURNAMENT_TITLE_LENGTH} and ${MAX_TOURNAMENT_TITLE_LENGTH} characters`),

        body("description")
            .optional().trim()
            .isLength({ min: MIN_TOURNAMENT_DESC_LENGTH, max: MAX_TOURNAMENT_DESC_LENGTH })
            .withMessage(`Tournament description must be between ${MIN_TOURNAMENT_DESC_LENGTH} and ${MAX_TOURNAMENT_DESC_LENGTH} characters`),

        body("status")
            .optional()
            .isIn(TOURNAMENT_STATUSES)
            .withMessage(`Tournament status must be one of: ${TOURNAMENT_STATUSES.join(", ")}`),

        body("format.bestof")
            .optional()
            .isIn(GAME_BESTOF_OPTIONS)
            .withMessage(`Format 'bestof' must be one of: ${GAME_BESTOF_OPTIONS.join(", ")}`),

        body("format.straightallowed")
            .optional()
            .isBoolean()
            .withMessage("Format 'straightallowed' must be a boolean"),

        body("format.roundTime")
            .optional()
            .isIn(GAME_ROUND_TIME_OPTIONS)
            .withMessage(`Format 'roundTime' must be one of: ${GAME_ROUND_TIME_OPTIONS.join(", ")} seconds`),

        body("minPlayers")
            .optional()
            .isInt({ min: MIN_TOURNAMENT_PLAYERS, max: 1000 })
            .withMessage(`Minimum players must be at least ${MIN_TOURNAMENT_PLAYERS}`),

        body("maxPlayers")
            .optional()
            .isInt({ min: MIN_TOURNAMENT_PLAYERS, max: 10000 })
            .withMessage(`Maximum players must be at least ${MIN_TOURNAMENT_PLAYERS}`),

        body("buyIn")
            .optional()
            .isInt({ min: 0 })
            .withMessage("Buy-in must be a non-negative integer"),

        body("eloRange.min")
            .optional({ nullable: true })
            .isInt({ min: 0 })
            .withMessage("Elo minimum must be a non-negative integer"),

        body("eloRange.max")
            .optional({ nullable: true })
            .isInt({ min: 0 })
            .withMessage("Elo maximum must be a non-negative integer")
            .bail()
            .custom((max, { req }) => {
                const min = req.body.eloRange?.min;
                if (min != null && max != null && Number(max) < Number(min)) {
                    throw new Error("Elo maximum must be greater than or equal to Elo minimum");
                }
                return true;
            }),

        body("startDate")
            .optional()
            .isISO8601()
            .withMessage("Start date must be a valid ISO 8601 date"),

        body("trophy.title")
            .optional().trim()
            .isLength({ min: MIN_TROPHY_TITLE_LENGTH, max: MAX_TROPHY_TITLE_LENGTH })
            .withMessage(`Trophy title must be between ${MIN_TROPHY_TITLE_LENGTH} and ${MAX_TROPHY_TITLE_LENGTH} characters`),

        body("trophy.imageUrl")
            .optional({ checkFalsy: true }).trim()
            .custom((val) => {
                if (val.startsWith("/uploads/")) return true;
                if (/^https?:\/\/.+/i.test(val)) return true;
                throw new Error("Trophy image must be an uploaded image or a valid http(s) URL");
            })
    ];
}

export function validateTournamentQuery(){
    return [

        query("page")
            .optional()
            .isInt({ min: 1 })
            .withMessage("Page must be a positive integer"),

        query("limit")
            .optional()
            .isInt({ min: MIN_PAGINATION_LIMIT, max: MAX_PAGINATION_LIMIT })
            .withMessage(`Limit must be between ${MIN_PAGINATION_LIMIT} and ${MAX_PAGINATION_LIMIT}`),

        query("status")
        .optional()
        .custom(val => {
            const parts = val.split(",").map(s => s.trim());
            if (!parts.every(p => TOURNAMENT_STATUSES.includes(p))) {
                throw new Error(`Each status must be one of: ${TOURNAMENT_STATUSES.join(", ")}`);
            }
            return true;
        }),

        query("sortBy")
            .optional()
            .isIn(["startDate", "title", "createdAt"])
            .withMessage("Sort field must be one of: startDate, title, or createdAt"),

        query("sortOrder")
            .optional()
            .isIn(["asc", "desc"])
            .withMessage("Sort order must be 'asc' or 'desc'")
    ];
}

export function validateTournamentWinner() {
    return [
        body("winnerId")
            .isInt({ min: 0, max: Number.MAX_SAFE_INTEGER })
            .withMessage("winnerId must be a valid integer")
            .bail()
            .toInt()
            .custom(async (winnerId) => {
                const user = await User.findOne({ userId: winnerId });
                if (!user) throw new Error("Winner user does not exist");
            })
    ];
}

export default {
    validateTournamentId,
    validateTournamentCreate,
    validateTournamentJoin,
    validateTournamentUpdate,
    validateTournamentQuery,
    validateTournamentWinner,
    validateTournamentLeave
};
