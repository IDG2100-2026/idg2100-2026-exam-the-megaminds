//code fetched from in-class code: idg-2100-backend.lt
import express from "express";

const nonApiRouter = express.Router();

// send error message for being on the wrong uri
nonApiRouter.get("/", (req,res)=>{
    res.status(404).send("You are in the wrong place, my guy:( buhu");
});

export default nonApiRouter;