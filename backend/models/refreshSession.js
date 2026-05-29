import mongoose from "mongoose";

const refreshSessionSchema = new mongoose.Schema({
    tokenHash: { type: String, required: true, unique: true, index: true},
    userId: { type: Number, ref: "User", required: true, index: true},
    userAgent: {type: String, default: null},
    expiresAt: { type: Date, required: true, expires: 0}
}, { timestamps: true});

export const RefreshSession = mongoose.model("RefreshSession", refreshSessionSchema);
export default RefreshSession;