import { body } from "express-validator";
import User from "../models/users.js";
import { GAME_BESTOF_OPTIONS, GAME_ROUND_TIME_OPTIONS } from "../configs/constants.js";

export function validateQueueJoin() {
    return [
        body("userId")
            .isInt({ min: 0, max: Number.MAX_SAFE_INTEGER })
            .withMessage("userId must be a valid integer")
            .bail()
            .toInt()
            .custom(async (userId) => {
                const user = await User.findOne({ userId });
                if (!user) throw new Error("User does not exist");
            }),

        body("rules.bestof")
            .optional()
            .isInt()
            .isIn(GAME_BESTOF_OPTIONS)
            .withMessage(`bestof must be one of: ${GAME_BESTOF_OPTIONS.join(", ")}`),

        body("rules.straightallowed")
            .optional()
            .isBoolean()
            .withMessage("straightallowed must be a boolean"),

        body("rules.roundTime")
            .optional()
            .isInt()
            .isIn(GAME_ROUND_TIME_OPTIONS)
            .withMessage(`roundTime must be one of: ${GAME_ROUND_TIME_OPTIONS.join(", ")} seconds`)
    ];
}

export function validateAnonQueueJoin() {
    return [
        body("rules.bestof")
            .optional()
            .isInt()
            .isIn(GAME_BESTOF_OPTIONS)
            .withMessage(`bestof must be one of: ${GAME_BESTOF_OPTIONS.join(", ")}`),

        body("rules.straightallowed")
            .optional()
            .isBoolean()
            .withMessage("straightallowed must be a boolean"),

        body("rules.roundTime")
            .optional()
            .isInt()
            .isIn(GAME_ROUND_TIME_OPTIONS)
            .withMessage(`roundTime must be one of: ${GAME_ROUND_TIME_OPTIONS.join(", ")} seconds`)
    ];
}

export default { validateQueueJoin, validateAnonQueueJoin };
