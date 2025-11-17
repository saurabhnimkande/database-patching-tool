import { getPipeline, updatePipeline } from "./pipelineManager.js";
import { getCreds } from "./configManager.js";
import PatchingManager from "./PatchingManager.js";
import path from "path";
import os from "os";
import { promises as fs } from "fs";
import { io } from "../index.js"


const activeJobs = new Map(); // pipelineId -> { controller, running }

export async function startPipeline(pipelineId) {
  if (activeJobs.has(pipelineId)) {
    // Already running
    return;
  }

  const pipeline = await getPipeline(pipelineId);
  if (!pipeline) {
    return;
  }

  // Update status to Running
  await updatePipeline(pipelineId, { status: 'Running', lastSuccess: null, lastDuration: null });

  const controller = new AbortController();
  activeJobs.set(pipelineId, { controller });

  // Emit start
  emitProgress(pipelineId, { status: 'Running', message: 'Pipeline started' });

  try {
    await executePipeline(pipeline, pipelineId, controller.signal);
  } catch (error) {
    console.error('Pipeline error:', error);
    await updatePipeline(pipelineId, { status: 'Failed' });
    emitProgress(pipelineId, { status: 'Failed', message: error.message });
  } finally {
    activeJobs.delete(pipelineId);
  }
}

export function cancelPipeline(pipelineId) {
  const job = activeJobs.get(pipelineId);
  if (job) {
    job.controller.abort();
    activeJobs.delete(pipelineId);
  }
}

async function executePipeline(pipeline, pipelineId, signal) {
  const startTime = Date.now();

  const masterCreds = await getCreds(pipeline.masterDatabase);
  const compareCreds = pipeline.compareDatabase ? await getCreds(pipeline.compareDatabase) : null;

  if (!masterCreds) {
    throw new Error(`Master database credentials not found: ${pipeline.masterDatabase}`);
  }

  const patchingManager = new PatchingManager({ schemaName: pipeline.masterSchema });

  await patchingManager.setUpDB({
    creds1: masterCreds,
    creds2: compareCreds
  });

  let result = "";
  let fileData = null;

  if (pipeline.type === 'generate') {
    if (pipeline.subType === 'tables') {
      result = await generateTables(patchingManager, pipeline, signal);
    } else if (pipeline.subType === 'views') {
      result = await generateViews(patchingManager, pipeline, signal);
    } else if (pipeline.subType === 'seed data') {
      result = await generateSeedData(patchingManager, pipeline, signal);
    }
  } else if (pipeline.type === 'compare') {
    if (pipeline.subType === 'tables') {
      result = await compareTables(patchingManager, pipeline, signal);
    } else if (pipeline.subType === 'views') {
      result = await compareViews(patchingManager, pipeline, signal);
    } else if (pipeline.subType === 'seed data') {
      result = await compareSeedData(patchingManager, pipeline, signal);
    }
  }

  if (pipeline.exportFileName && result) {
    fileData = await generateFile(result, pipeline.exportFileName);
  }

  const duration = Date.now() - startTime;

  await updatePipeline(pipelineId, { status: 'Completed', lastSuccess: new Date().toISOString(), lastDuration: duration });
  emitProgress(pipelineId, { status: 'Completed', message: 'Pipeline completed successfully' });

  if (fileData && pipeline.exportMode) {
    emitFile(pipelineId, fileData);
  }
}

async function generateTables(manager, pipeline, signal) {
  const tables = await manager.getAllTables({ client: manager.getClient1() }, { schema: pipeline.masterSchema });
  const result = [];
  emitProgress(pipeline.id, { status: 'Running', progress: 10, message: 'Fetching tables' });

  for (let i = 0; i < tables.length; i++) {
    if (signal.aborted) throw new Error('Cancelled');
    const table = tables[i];
    const baseProgress = Math.floor(20 + (i / tables.length) * 70);

    emitProgress(pipeline.id, { status: 'Running', progress: baseProgress, message: `Processing table ${table.tablename} - getting columns` });
    const columns = await manager.getAllColumns({ client: manager.getClient1() });

    emitProgress(pipeline.id, { status: 'Running', progress: Math.floor(baseProgress + ((1 / tables.length) * 70) * 0.33), message: `Processing table ${table.tablename} - getting constraints` });
    const constraints = await manager.getAllConstraints({ client: manager.getClient1() });

    emitProgress(pipeline.id, { status: 'Running', progress: Math.floor(baseProgress + ((1 / tables.length) * 70) * 0.66), message: `Processing table ${table.tablename} - getting indexes` });
    const indexes = await manager.getAllIndexes({ client: manager.getClient1() });

    emitProgress(pipeline.id, { status: 'Running', progress: Math.floor(baseProgress + ((1 / tables.length) * 70) * 0.9), message: `Processing table ${table.tablename} - generating script` });
    const createScript = manager.generateCreateTableScript({ columns, indexes, constraints });
    result.push(createScript);

    emitProgress(pipeline.id, { status: 'Running', progress: Math.floor(baseProgress + ((1 / tables.length) * 70)), message: `Completed table ${table.tablename}` });
  }

  emitProgress(pipeline.id, { status: 'Running', progress: 95, message: 'Finalizing' });

  return result.join('\n\n--------------------------------------------------------------------------------\n\n');
}

async function generateViews(manager, pipeline, signal) {
  emitProgress(pipeline.id, { status: 'Running', progress: 10, message: 'Fetching views' });
  const views = await manager.getAllViews({ client: manager.getClient1() });
  emitProgress(pipeline.id, { status: 'Running', progress: 50, message: 'Generating views' });
  const result = manager.generateCreateViewsScript({ array1: views, viewsDiff: views.map(v => v.view_name) }, "");
  emitProgress(pipeline.id, { status: 'Running', progress: 95, message: 'Finalizing' });
  return result.unorderedViews || result.views || result.tenantViews;
}

async function generateSeedData(manager, pipeline, signal) {
  emitProgress(pipeline.id, { status: 'Running', progress: 50, message: 'Generating seed data' });
  // Not implemented, assume using bin/helper files
  return "-- Seed data script";
}

async function compareTables(manager, pipeline, signal) {
  emitProgress(pipeline.id, { status: 'Running', message: 'Comparing tables' });
  throw new Error('Compare tables not implemented');
}

async function compareViews(manager, pipeline, signal) {
  emitProgress(pipeline.id, { status: 'Running', message: 'Comparing views' });
  throw new Error('Compare views not implemented');
}

async function compareSeedData(manager, pipeline, signal) {
  emitProgress(pipeline.id, { status: 'Running', message: 'Comparing seed data' });
  throw new Error('Compare seed data not implemented');
}

async function generateFile(content, fileName) {
  const outputDir = path.join(os.homedir(), ".database-patching-tool", "outputs");
  await fs.mkdir(outputDir, { recursive: true });
  const filePath = path.join(outputDir, fileName);
  await fs.writeFile(filePath, content, 'utf-8');
  return { fileName, content };
}

function emitProgress(pipelineId, data) {
  io.to(pipelineId).emit('pipeline-progress', { pipelineId, ...data });
}

function emitFile(pipelineId, fileData) {
  io.to(pipelineId).emit('pipeline-file', { pipelineId, ...fileData });
}

