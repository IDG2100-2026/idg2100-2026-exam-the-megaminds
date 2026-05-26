//Code fetched from in-class code: idg-2100-backend.lt
import mongoose from "mongoose";

const { DB_HOSTNAME, DB_PORT, DB_NAME } = process.env;

const URI_CONNECTION = `mongodb://${DB_HOSTNAME}:${DB_PORT}/${DB_NAME}`;

// Connect to DB
export async function connectDB(){
    if(DB_HOSTNAME && DB_PORT && DB_NAME){
        mongoose.connection.on("error", err=>{
            console.error("Unhandeled Mongoose/MoongoDB connection error:", err);
        });
        console.log("Connecting to MongoDB now...", URI_CONNECTION);
        return mongoose.connect(
            URI_CONNECTION,
            {
                appName: DB_NAME,
                maxPoolSize: 50
            }
        );
    }
    throw new Error(`Missing env variables needed to connect to mongoDB: ${DB_HOSTNAME}, ${DB_PORT}, ${DB_NAME}`);
}

//Disconnect from DB
export async function disconnectDB(){
    return mongoose.disconnect();
}