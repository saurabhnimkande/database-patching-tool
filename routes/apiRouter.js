import express from "express";
import dbConfiRouter from "./dbConfigRouter.js";
import pipelineRouter from "./pipelineRouter.js";

const router = express.Router();

router.use("/db-config", dbConfiRouter);
router.use("/pipelines", pipelineRouter);

export default router;
