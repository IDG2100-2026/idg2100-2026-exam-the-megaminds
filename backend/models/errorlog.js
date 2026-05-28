import mongoose from "mongoose";

const errorLogSchema = new mongoose.Schema({
    type: { type: String, enum: ["frontend", "backend"], default: "frontend" },
    message: { type: String, required: true, maxLength: 2000 },
    stack: { type: String, default: null },
    url: { type: String, default: null },
    userId: { type: Number, ref: "User", defailt: null },
    userAgent: { type: String, default: null }
}, { timestamps: true });

export const ErrorLog = mongoose.model("ErrorLog", errorLogSchema);
export default ErrorLog;