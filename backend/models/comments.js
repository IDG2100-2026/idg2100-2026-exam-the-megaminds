import mongoose from "mongoose";
import { MIN_COMMENT_LENGTH, MAX_COMMENT_LENGTH } from "../configs/constants.js";

const commentSchema = new mongoose.Schema({
    commentId:{
        type: Number,
        index: true,    // creates a DB index on this field for faster lookups
        required: true,
        min: 0,
        max: Number.MAX_SAFE_INTEGER
    },
    userId:{
        type: Number,
        ref: "User",    // ref links to the User model — like a foreign key
        required: true
    },
    gameId:{
        type: String,
        ref: "Game",
        default: null
    },
    tournamentId:{
        type: String,
        ref: "Tournament",
        default: null
    },
    text: {
        type: String,
        required: true,
        trim: true,
        minLength: [MIN_COMMENT_LENGTH, "Comment can't be empty"],
        maxLength: [MAX_COMMENT_LENGTH, `Comment can't be longer than ${MAX_COMMENT_LENGTH} characters`]
    }
}, { timestamps: true }); // timestamps: true auto-adds createdAt and updatedAt fields

// .pre() is a Mongoose lifecycle hook — runs automatically before the document is validated/saved
commentSchema.pre("validate", async function (){
    // Auto-generate a random numeric ID if one wasn't provided
    if(!this.commentId) {
        this.commentId = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
    }

    // A comment must belong to either a game or a tournament
    if(!this.gameId && !this.tournamentId){
        throw new Error("Need at least one reference (Game or Tournament) to be able to comment");
    }
});

const Comment = mongoose.model("Comment", commentSchema);
export { Comment };
export default Comment;