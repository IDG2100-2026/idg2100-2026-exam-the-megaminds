import mongoose from "mongoose";
import {
    GAME_BESTOF_OPTIONS,
    GAME_ROUND_TIME_OPTIONS,
    TOURNAMENT_STATUSES,
    MIN_TOURNAMENT_TITLE_LENGTH,
    MAX_TOURNAMENT_TITLE_LENGTH,
    MIN_TOURNAMENT_DESC_LENGTH,
    MAX_TOURNAMENT_DESC_LENGTH,
    MIN_TOURNAMENT_PLAYERS
} from "../configs/constants.js";

const tournamentSchema = new mongoose.Schema({
    tournamentId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        minLength: [MIN_TOURNAMENT_TITLE_LENGTH, `Title can't be shorter than ${MIN_TOURNAMENT_TITLE_LENGTH} characters`],
        maxLength: [MAX_TOURNAMENT_TITLE_LENGTH, `Title can't be longer than ${MAX_TOURNAMENT_TITLE_LENGTH} characters`]
    },
    description: {
        type: String,
        required: true,
        trim: true,
        minLength: [MIN_TOURNAMENT_DESC_LENGTH, `Description can't be shorter than ${MIN_TOURNAMENT_DESC_LENGTH} characters`],
        maxLength: [MAX_TOURNAMENT_DESC_LENGTH, `Description can't be longer than ${MAX_TOURNAMENT_DESC_LENGTH} characters`]
    },
    // Format configuration for the tournament
    format: {
        bestof: {
            type: Number,
            required: true,
            enum: GAME_BESTOF_OPTIONS
        },
        straightallowed: {
            type: Boolean,
            required: true
        },
        roundTime: {
            type: Number,
            required: true,
            enum: GAME_ROUND_TIME_OPTIONS // seconds
        }
    },
    // Player constraints
    minPlayers: {
        type: Number,
        required: true,
        min: [MIN_TOURNAMENT_PLAYERS, `A tournament must have at least ${MIN_TOURNAMENT_PLAYERS} players`]
    },
    maxPlayers: {
        type: Number,
        required: true,
        min: 2,
        validate: {
            validator: function(val) {
                return val >= this.minPlayers;
            },
            message: "maxPlayers must be greater than or equal to minPlayers"
        }
    },
        buyIn: {
        type: Number,
        default: 0,
        min: 0
    },
    // Elo gating — null on a side means "open" in that direction
    eloRange: {
        min: { type: Number, default: null, min: 0 },
        max: { type: Number, default: null, min: 0 }
    },
    // Schedule
    startDate: {
        type: Date,
        required: true
    },
    // Status tracking
    status: {
        type: String,
        required: true,
        enum: TOURNAMENT_STATUSES,
        default: "pending"
    },
    // Participants array (stores user IDs)
    participants: [
        {
            type: Number, // userId
            ref: "User"
        }
    ],
    // Games played in this tournament (all rounds combined)
    games: [
        {
            type: String,
            ref: "Game"
        }
    ],
    // Tracks which round is currently being played (0 = not started)
    currentRound: {
        type: Number,
        default: 0
    },
    nextRoundStartsAt: {
        type: Date,
        defualt: null
    },
    // Each entry stores the game IDs for one round and any player who received a bye
    rounds: [
        {
            roundNumber: { type: Number, required: true },
            games: [{ type: String, ref: "Game" }],
            // extra player gets a free pass to the next round when participants are odd
            byeUserId: { type: Number, default: null }
        }
    ],
    // Trophy awarded to winner
    trophy: {
        title: {
            type: String,
            required: true
        },
        imageUrl: {
            type: String,
            default: null
        }
    },
    // Admin info
    createdBy: {
        type: Number,
        ref: "User",
        required: true
    },
    winnerId: {
        type: Number,
        ref: "User",
        default: null
    }
}, { timestamps: true });

// Auto-generate a readable, unique-ish tournamentId from the title on creation,
// so admins/clients never have to supply one (mirrors how userId is generated).
tournamentSchema.pre("validate", function () {
    if (this.isNew && !this.tournamentId) {
        const slug = (this.title || "tournament")
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")   // non-alphanumerics → hyphens
            .replace(/^-+|-+$/g, "")       // trim leading/trailing hyphens
            .slice(0, 40);
        const suffix = Math.random().toString(36).slice(2, 8);  // 6 random chars
        this.tournamentId = `${slug}-${suffix}`;
    }
});

const Tournament = mongoose.model("Tournament", tournamentSchema);
export { Tournament };
export default Tournament;
