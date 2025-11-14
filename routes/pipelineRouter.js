import express from "express";
import { savePipeline, getAllPipelines, getPipeline, updatePipeline, deletePipeline, pipelineExists } from "../utils/pipelineManager.js";

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const {
      name,
      type,
      subType,
      description,
      masterDatabase,
      masterSchema,
      compareDatabase,
      compareSchema,
      selectedDataset,
      exportFileName,
      exportMode
    } = req.body;

    // Validate required fields
    if (!name || !type || !masterDatabase || !masterSchema) {
      return res.status(400).send({
        status: "Error",
        message: "Missing required fields: name, type, masterDatabase, masterSchema",
        result: {},
      });
    }

    const pipelineData = {
      name,
      type,
      subType,
      description,
      masterDatabase,
      masterSchema,
      compareDatabase,
      compareSchema,
      selectedDataset,
      exportFileName,
      exportMode,
    };

    const savedPipeline = await savePipeline(pipelineData);

    return res.status(201).send({
      status: "Success",
      message: "Pipeline created successfully",
      result: savedPipeline,
    });
  } catch (error) {
    console.log("error:", error);
    return res.status(500).send({
      status: "Error",
      message: error.message,
      result: {},
    });
  }
});

router.get("/list", async (req, res) => {
  try {
    const pipelines = await getAllPipelines();

    return res.status(200).send({
      status: "Success",
      message: "List of all pipelines",
      result: pipelines,
    });
  } catch (error) {
    console.log("error:", error);
    return res.status(500).send({
      status: "Error",
      message: error.message,
      result: {},
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const pipeline = await getPipeline(id);

    if (!pipeline) {
      return res.status(404).send({
        status: "Error",
        message: `Pipeline with id ${id} not found`,
        result: {},
      });
    }

    return res.status(200).send({
      status: "Success",
      message: "Pipeline retrieved successfully",
      result: pipeline,
    });
  } catch (error) {
    console.log("error:", error);
    return res.status(500).send({
      status: "Error",
      message: error.message,
      result: {},
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!(await pipelineExists(id))) {
      return res.status(404).send({
        status: "Error",
        message: `Pipeline with id ${id} not found`,
        result: {},
      });
    }

    const updatedPipeline = await updatePipeline(id, updateData);

    return res.status(200).send({
      status: "Success",
      message: "Pipeline updated successfully",
      result: updatedPipeline,
    });
  } catch (error) {
    console.log("error:", error);
    return res.status(500).send({
      status: "Error",
      message: error.message,
      result: {},
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!(await pipelineExists(id))) {
      return res.status(404).send({
        status: "Error",
        message: `Pipeline with id ${id} not found`,
        result: {},
      });
    }

    await deletePipeline(id);

    return res.status(200).send({
      status: "Success",
      message: "Pipeline deleted successfully",
      result: {},
    });
  } catch (error) {
    console.log("error:", error);
    return res.status(500).send({
      status: "Error",
      message: error.message,
      result: {},
    });
  }
});

export default router;
