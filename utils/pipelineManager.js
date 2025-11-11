import { promises as fs } from "fs";
import path from "path";
import os from "os";

const CONFIG_DIR = path.join(os.homedir(), ".database-patching-tool");
const PIPELINES_FILE = path.join(CONFIG_DIR, "pipelines.json");

/**
 * Ensures the config directory and pipelines file exist
 * @private
 */
async function ensurePipelinesFile() {
  await fs.mkdir(CONFIG_DIR, { recursive: true });

  try {
    await fs.access(PIPELINES_FILE);
  } catch {
    // Create default pipelines structure if file doesn't exist
    const defaultPipelines = {
      pipelines: [],
    };
    await fs.writeFile(PIPELINES_FILE, JSON.stringify(defaultPipelines, null, 2));
  }
}

/**
 * Reads the pipelines file and returns its contents
 * @private
 * @returns {Promise<Object>} The pipelines object
 */
async function readPipelines() {
  await ensurePipelinesFile();
  const data = await fs.readFile(PIPELINES_FILE, "utf-8");
  return JSON.parse(data);
}

/**
 * Writes data to the pipelines file
 * @private
 * @param {Object} data - The data to write
 */
async function writePipelines(data) {
  await fs.writeFile(PIPELINES_FILE, JSON.stringify(data, null, 2));
}

/**
 * Saves a new pipeline
 * @param {Object} pipeline - The pipeline object
 */
export async function savePipeline(pipeline) {
  const pipelinesData = await readPipelines();
  const newPipeline = {
    id: Date.now().toString(),
    ...pipeline,
    createdAt: new Date().toISOString(),
    status: 'Ready to start',
    lastSuccess: null,
    lastDuration: null,
  };
  pipelinesData.pipelines.push(newPipeline);
  await writePipelines(pipelinesData);
  return newPipeline;
}

/**
 * Retrieves all pipelines
 * @returns {Promise<Array>} The pipelines array
 */
export async function getAllPipelines() {
  const pipelinesData = await readPipelines();
  return pipelinesData.pipelines || [];
}

/**
 * Retrieves a pipeline by ID
 * @param {string} id - The pipeline ID
 * @returns {Promise<Object|null>} The pipeline object or null if not found
 */
export async function getPipeline(id) {
  const pipelinesData = await readPipelines();
  return pipelinesData.pipelines.find(pipeline => pipeline.id === id) || null;
}

/**
 * Updates a pipeline by ID
 * @param {string} id - The pipeline ID
 * @param {Object} updatedPipeline - The updated pipeline data
 */
export async function updatePipeline(id, updatedPipeline) {
  const pipelinesData = await readPipelines();
  const index = pipelinesData.pipelines.findIndex(pipeline => pipeline.id === id);
  if (index !== -1) {
    pipelinesData.pipelines[index] = {
      ...pipelinesData.pipelines[index],
      ...updatedPipeline,
      updatedAt: new Date().toISOString()
    };
    await writePipelines(pipelinesData);
    return pipelinesData.pipelines[index];
  }
  return null;
}

/**
 * Deletes a pipeline by ID
 * @param {string} id - The pipeline ID
 */
export async function deletePipeline(id) {
  const pipelinesData = await readPipelines();
  pipelinesData.pipelines = pipelinesData.pipelines.filter(pipeline => pipeline.id !== id);
  await writePipelines(pipelinesData);
}

/**
 * Checks if a pipeline exists by ID
 * @param {string} id - The pipeline ID
 * @returns {Promise<boolean>} True if pipeline exists
 */
export async function pipelineExists(id) {
  const pipelinesData = await readPipelines();
  return pipelinesData.pipelines.some(pipeline => pipeline.id === id);
}
