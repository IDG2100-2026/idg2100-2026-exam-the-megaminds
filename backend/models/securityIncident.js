import mongoose from "mongoose";

const securityIncidentSchema = new mongoose.Schema({
    type: {type: String, enum: ["ip-change", "rate-limit"], required: true},
    userId: {type: Number, ref: "User", default: null },
    ip: {type: String, default: null},
    tokenIp: {type: String, default: null},
    userAgent: {type: String, default: null},
    path: {type: String, default: null}
}, {timestamps: true});

export const SecurityIncident = mongoose.model("SecurityIncident", securityIncidentSchema);
export default SecurityIncident;
