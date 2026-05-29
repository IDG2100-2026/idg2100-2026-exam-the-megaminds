import { param, body } from "express-validator";
import User from "../models/users.js";
import {
    MIN_PWD_LENGTH,
    MAX_PWD_LENGTH,
    MIN_USERNAME_LENGTH,
    MAX_USERNAME_LENGTH,
    MIN_USER_AGE
} from "../configs/constants.js";

export function validateUserId(){
    return [
        param("userId")
            .isInt({ min: 0, max: Number.MAX_SAFE_INTEGER })
            .withMessage("User IDs are supposed to be integers larger than 0")
            .bail()
            .toInt()
            .custom(async (userId) => {
                const user = await User.findOne({ userId: userId });
                if (!user) {
                    throw new Error("User does not exist");
                }
            })
    ];
}

export function validateUserCreate(){
    return [
        body("username")
            .trim()
            .escape()
            .isAlphanumeric()
            .withMessage("Only alphanumeric characters allowed in username")
            .isLength({ min: MIN_USERNAME_LENGTH, max: MAX_USERNAME_LENGTH })
            .withMessage(`Username must be between ${MIN_USERNAME_LENGTH} and ${MAX_USERNAME_LENGTH} characters`)
            .bail()
            .custom(async (username) => {
                const existingUser = await User.findOne({ username });
                if (existingUser) {
                    throw new Error("This username already exists");
                }
            }),
        body("email")
            .trim()
            .toLowerCase()
            .normalizeEmail()
            .isEmail()
            .withMessage("Please provide a valid email address")
            .bail()
            .custom(async (email) => {
                const existingEmail = await User.findOne({ email });
                if (existingEmail) {
                    throw new Error("This email is already in use");
                }
            }),
        body("pwd")
            .trim()
            .isLength({ min: MIN_PWD_LENGTH, max: MAX_PWD_LENGTH })
            .withMessage(`Password must be between ${MIN_PWD_LENGTH} and ${MAX_PWD_LENGTH} characters`)
            .bail()
            .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d].{8,}$/)
            .withMessage("Password must contain both letters and numbers"),
        body("age")
            .isInt({ min: MIN_USER_AGE })
            .withMessage(`You must be at least ${MIN_USER_AGE} years old to register`)
    ];
}

// username can't change — only email, pwd, age, and banned status are updatable
export function validateUserUpdate(){
    return [
        // Username cannot be changed after registration
        body("username")
            .not().exists()
            .withMessage("Username cannot be changed after registration"),
        body("email")
            .optional()
            .trim()
            .toLowerCase()
            .normalizeEmail()
            .isEmail()
            .withMessage("Please provide a valid email address")
            .bail()
            .custom(async (email, { req }) => {
                const existingEmail = await User.findOne({ email, userId: { $ne: parseInt(req.params.userId, 10) } });
                if (existingEmail) {
                    throw new Error("This email is already in use");
                }
            }),
        body("pwd")
            .optional()
            .trim()
            .isLength({ min: MIN_PWD_LENGTH, max: MAX_PWD_LENGTH })
            .withMessage(`Password must be between ${MIN_PWD_LENGTH} and ${MAX_PWD_LENGTH} characters`)
            .bail()
            .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d].{8,}$/)
            .withMessage("Password must contain both letters and numbers"),
        body("age")
            .optional()
            .isInt({ min: MIN_USER_AGE })
            .withMessage(`You must be at least ${MIN_USER_AGE} years old`),
        body("banned")
            .optional()
            .isBoolean()
            .withMessage("banned must be a boolean (true or false)"),
        body("aboutMe")
            .optional()
            .trim()
            .isLength({ max: 300 })
            .withMessage("About me can't exceed 300 characters"),
        body("preferences")
            .optional()
            .isObject()
            .withMessage("preferences must be an object")
    ];
}

export default {
    validateUserId,
    validateUserCreate,
    validateUserUpdate
};