import mongoose from "mongoose";
import {
    GAME_BESTOF_OPTIONS,
    GAME_ROUND_TIME_OPTIONS,
    GAME_NUM_PLAYERS_OPTIONS,
    GAME_BUYIN_OPTIONS,
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
        bestof: { type: Number, required: true, enum: GAME_BESTOF_OPTIONS },
        straightallowed: { type: Boolean, required: true },
        roundTime: { type: Number, required: true, enum: GAME_ROUND_TIME_OPTIONS },
        numPlayers: { type: Number, required: true, enum: GAME_NUM_PLAYERS_OPTIONS, default: 2 },
        buyIn: { type: Number, required: true, enum: GAME_BUYIN_OPTIONS, default: 1 },
        minElo: { type: Number, default: null },
        maxElo: { type: Number, default: null }
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
            },
            stack: {
                type: Number,
                default: 0    // final chip stack when the game is recorded
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