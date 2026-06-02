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
            enum: GAME_ROUND_TIME_OPTIONS
        }
    },

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

    eloRange: {
        min: { type: Number, default: null, min: 0 },
        max: { type: Number, default: null, min: 0 }
    },

    startDate: {
        type: Date,
        required: true
    },

    status: {
        type: String,
        required: true,
        enum: TOURNAMENT_STATUSES,
        default: "pending"
    },

    participants: [
        {
            type: Number,
            ref: "User"
        }
    ],

    games: [
        {
            type: String,
            ref: "Game"
        }
    ],

    currentRound: {
        type: Number,
        default: 0
    },
    nextRoundStartsAt: {
        type: Date,
        defualt: null
    },

    rounds: [
        {
            roundNumber: { type: Number, required: true },
            games: [{ type: String, ref: "Game" }],

            byeUserId: { type: Number, default: null }
        }
    ],

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

tournamentSchema.pre("validate", function () {
    if (this.isNew && !this.tournamentId) {
        const slug = (this.title || "tournament")
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 40);
        const suffix = Math.random().toString(36).slice(2, 8);
        this.tournamentId = `${slug}-${suffix}`;
    }
});

const Tournament = mongoose.model("Tournament", tournamentSchema);
export { Tournament };
export default Tournament;
