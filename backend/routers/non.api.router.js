import express from "express";

const nonApiRouter = express.Router();

nonApiRouter.get("/", (req,res)=>{
    res.status(404).send("You are in the wrong place, my guy:( buhu");
});

export default nonApiRouter;