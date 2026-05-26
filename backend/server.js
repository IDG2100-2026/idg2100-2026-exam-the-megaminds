//some code fetced from in-class code: idg2100-backen.lt
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

// getting mongoose to connect to mongoDB
await connectDB();

// create an express app
const diceApp = express();

// registers middelware or router on every request
diceApp.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true // credentials: true lets cookies be sent cross-origin
}));
diceApp.use(cookieParser()); // handles non-API routes

const __dirname = path.dirname(fileURLToPath(import.meta.url));
diceApp.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// mounting routers
diceApp.use("/", nonApiRouter);
diceApp.use("/api", apiRouter);
diceApp.use(errorHandler);

// getting port
const port = process.env.APP_PORT;

// Launching app
const server = diceApp.listen(port, ()=>{console.log("Spanish Poker Dice app is listening", port);});
initGameSocket(server);

// graceful shutdown
async function shutDown(){
    console.log("\nThe Spanish Poker Dice app is being shut down...");
    await disconnectDB();
    server.close(()=>{
        process.exit(0);
    });
}

process.on("SIGINT", shutDown);
process.on("SIGTERM", shutDown);