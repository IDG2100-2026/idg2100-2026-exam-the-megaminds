import mongoose from "mongoose";
import {
    GAME_BESTOF_OPTIONS,
    GAME_ROUND_TIME_OPTIONS,
    GAME_STATUSES
} from "../configs/constants.js";

const gameSchema = new mongoose.Schema({
    gameId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    rules: {
        // enum restricts the value to only the allowed options
        bestof: { type: Number, required: true, enum: GAME_BESTOF_OPTIONS },
        straightallowed: { type: Boolean, required: true },
        roundTime: { type: Number, required: true, enum: GAME_ROUND_TIME_OPTIONS }
    },
    players: [
        {
            // ref links to the User model
            userId: {
                type: Number,
                ref: "User",
                required: true
            },
            score: {
                type: Number,
                default: 0
            }
        }
    ],
    winnerId:{
        type: Number,
        ref: "User",
        default: null    // null until the game is finished
    },
    status:{
        type: String,
        required: true,
        enum: GAME_STATUSES,
        trim: true,
        default: "pending"
    },
    tournamentId:{
        type: String,
        ref:"Tournament",
        default: null    // null for standalone games
    }
}, { timestamps: true }); // timestamps: true auto-adds createdAt and updatedAt fields

const Game = mongoose.model("Game", gameSchema);
export { Game };
export default Game;