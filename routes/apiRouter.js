import express from "express";
import dbConfiRouter from "./dbConfigRouter.js";
const router = express.Router();

router.use("/db-config", dbConfiRouter);

export default router;
