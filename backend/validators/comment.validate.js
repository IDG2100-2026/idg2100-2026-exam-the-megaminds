import { param, body, query } from "express-validator";
import User from "../models/users.js";
import { Comment } from "../models/comments.js";
import { MIN_COMMENT_LENGTH, MAX_COMMENT_LENGTH, MIN_PAGINATION_LIMIT, MAX_PAGINATION_LIMIT } from "../configs/constants.js";

export function validateCommentId(){
    return [
        param("commentId")
            .isInt({ min: 0, max: Number.MAX_SAFE_INTEGER })
            .withMessage("Comment ID must be a valid integer")
            .bail()
            .toInt()

            .custom(async (commentId) => {
                const comment = await Comment.findOne({ commentId: commentId });
                if (!comment) throw new Error("Comment does not exist");
            })
    ];
}

export function validateCommentCreate(){
    return [
        body("text")
            .trim()
            .escape()
            .isLength({ min: MIN_COMMENT_LENGTH, max: MAX_COMMENT_LENGTH })
            .withMessage(`Comment must be between ${MIN_COMMENT_LENGTH} and ${MAX_COMMENT_LENGTH} characters`)

    ];
}

export function validateCommentQuery(){
    return [
        query("page")
            .optional()
            .isInt({ min: 1 })
            .withMessage("Page must be a positive integer"),

        query("limit")
            .optional()
            .isInt({ min: MIN_PAGINATION_LIMIT, max: MAX_PAGINATION_LIMIT })
            .withMessage(`Limit must be between ${MIN_PAGINATION_LIMIT} and ${MAX_PAGINATION_LIMIT}`),

        query("sortBy")
            .optional()
            .isIn(["timestamp", "userId"])
            .withMessage("Sort field must be one of: timestamp or userId"),

        query("sortOrder")
            .optional()
            .isIn(["asc", "desc"])
            .withMessage("Sort order must be 'asc' or 'desc'")
    ];
}

export function validateCommentUpdate(){
    return [
        body("text")
            .optional()
            .trim()
            .escape()
            .isLength({ min: MIN_COMMENT_LENGTH, max: MAX_COMMENT_LENGTH })
            .withMessage(`Comment must be between ${MIN_COMMENT_LENGTH} and ${MAX_COMMENT_LENGTH} characters`)
    ];
}

export default {
    validateCommentId,
    validateCommentCreate,
    validateCommentQuery,
    validateCommentUpdate
};
