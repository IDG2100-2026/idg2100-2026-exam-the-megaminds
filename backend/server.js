import cors from "cors";
import { initGameSocket } from "./websocket/gameSocket.js";
import cookieParser from "cookie-parser";
import express from "express";
import nonApiRouter from "./routers/non.api.router.js";
import apiRouter from "./routers/api.router.js";
import { connectDB, disconnectDB } from "./configs/db.js";
import { errorHandler } from "./middleware/error.js";
import path from 'path';
import { fileURLToPath } from 'url';

await connectDB();

import { scheduleWeeklyPoints } from './jobs/weeklyPoints.js';
scheduleWeeklyPoints();

const diceApp = express();

diceApp.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
diceApp.use(cookieParser());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
diceApp.use('/uploads', express.static(path.join(__dirname, 'uploads')));

diceApp.use("/", nonApiRouter);
diceApp.use("/api", apiRouter);
diceApp.use(errorHandler);

const port = process.env.APP_PORT;

const server = diceApp.listen(port, ()=>{console.log("Spanish Poker Dice app is listening", port);});
initGameSocket(server);

let shuttingDown = false;
async function shutDown(){
    if (shuttingDown) return;
    shuttingDown = true;
    console.log("\nThe Spanish Poker Dice app is being shut down...");
    server.close();
    await disconnectDB();
    process.exit(0);
}

process.on("SIGINT", shutDown);
process.on("SIGTERM", shutDown);