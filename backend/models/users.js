import mongoose from "mongoose";
import { hashPwd } from "../utils/hash.js";
import {
    MIN_PWD_LENGTH,
    MAX_PWD_LENGTH,
    MIN_USERNAME_LENGTH,
    MAX_USERNAME_LENGTH,
    MIN_USER_AGE
} from "../configs/constants.js";

const userSchema = new mongoose.Schema({
    userId:{
        type: Number,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        index: true,
        required: true
    },
    username:{
        type: String,
        required: true,
        trim: true,
        minLength: [MIN_USERNAME_LENGTH, `Username can't be shorter than ${MIN_USERNAME_LENGTH} characters`],
        maxLength: [MAX_USERNAME_LENGTH, `Username can't be longer than ${MAX_USERNAME_LENGTH} characters`]
    },
    email:{
		type: String,
		required: true,
		trim: true,
		lowercase: true,
		match: [/^.+@[a-z]+\.[a-z]+$/, "{VALUE} isn't a valid email."],
		validate: {
			validator: async function(email){
				return ! await User.exists({ email, _id: { $ne: this._id } });
			},
			message: "Email {VALUE} is already in use"
		}
	},
    pwd:{
        type: String,
        required: true,
        trim: true,
        maxLength: [MAX_PWD_LENGTH, `Who the hell can keep track of ${MAX_PWD_LENGTH} characters without having the browser save it`],
        minLength: [MIN_PWD_LENGTH, `Passwords can't be shorter than ${MIN_PWD_LENGTH} characters`],
        match: [/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, "Password must contain letters and numbers and be at least 8 characters long."]
    },
    elo:{
        type: Number,
        default: 1000,
        min: 0
    },
    eloChangeLastWeek:{
        type: Number,
        default: 0
    },
    eloWeekStart: {
        type: Date,
        default: Date.now
    },
    trophies: [
    {
        title: { type: String, required: true },
        imageUrl: { type: String, default: null },
        tournamentId: { type: String, ref: "Tournament" },
        awardedAt: { type: Date, default: Date.now }
    }
],
    wins: {
        type: Number,
        default: 0
    },
    losses: {
        type: Number,
        default: 0
    },
    totalGames: {
        type: Number,
        default: 0
    },
    winPercentage: {
        type: Number,
        default: 0
    },
    age: {
        type: Number,
        required: true,
        min: [MIN_USER_AGE, `You must be at least ${MIN_USER_AGE} years old to register`]
    },
    // Admins can ban users to prevent them from participating in games and matchmaking
    banned: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

userSchema.pre("validate", function(){
	if(this.isNew) {
		if(this.userId !== undefined){
			console.warn("UIDs are supposed to be auto-generated. Discarding the passed value: ", this.userId);
		}
		this.userId = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
	}
	if(this.isModified("pwd")){
		this.pwd = hashPwd(this.pwd);
	}
});

export const User = mongoose.model("User", userSchema);
export default User;