import { promises as fs } from "fs";
import path from "path";
import os from "os";

const CONFIG_DIR = path.join(os.homedir(), ".pace-patching-tool-cli");
const CREDS_CONFIG_FILE = path.join(CONFIG_DIR, "creds_config.json");
const PATH_CONFIG_FILE = path.join(CONFIG_DIR, "path_config.json");

// Helper: Ensure config dir & file exist
async function ensureConfigFile(filePath) {
  await fs.mkdir(CONFIG_DIR, { recursive: true });

  try {
    await fs.access(filePath);
  } catch {
    // Create an empty JSON object if file doesn't exist
    await fs.writeFile(filePath, JSON.stringify({}, null, 2));
  }
}

// Helper: Read config JSON
async function readConfig(filePath) {
  await ensureConfigFile(filePath);
  const data = await fs.readFile(filePath, "utf-8");
  return JSON.parse(data);
}

// Helper: Write config JSON
async function writeConfig(data, filePath) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Save a credential to specific env (e.g., "dev_env")
export async function saveCreds(env, value) {
  const config = await readConfig(CREDS_CONFIG_FILE);
  if (!config[env]) config[env] = {};
  config[env] = value;
  await writeConfig(config, CREDS_CONFIG_FILE);
}

// Save path for the files/directory
export async function savePath(objectName, value) {
  const config = await readConfig(PATH_CONFIG_FILE);
  if (!config[objectName]) config[objectName] = "";
  config[objectName] = value;
  await writeConfig(config, PATH_CONFIG_FILE);
}

// Fetch the credentials for specific env
export async function getCreds(key, type) {
  const config = await readConfig(type === "creds" ? CREDS_CONFIG_FILE : PATH_CONFIG_FILE);
  return config[key] ? config[key] : null;
}

// Check if a key exists under a specific env
export async function keyExists(env) {
  const config = await readConfig(CREDS_CONFIG_FILE);
  return config[env] ? true : false;
}

// Delete a single key from a specific env
export async function deleteCred(env) {
  const config = await readConfig(CREDS_CONFIG_FILE);
  if (config[env]) {
    delete config[env];
    await writeConfig(config, CREDS_CONFIG_FILE);
  }
}

// Delete a single key from a specific objectName
export async function deletePath(objectName) {
  const config = await readConfig(PATH_CONFIG_FILE);
  if (config[objectName]) {
    delete config[objectName];
    await writeConfig(config, PATH_CONFIG_FILE);
  }
}

// Delete all credentials (reset config)
export async function deleteAllCreds() {
  await writeConfig({}, CREDS_CONFIG_FILE);
}

// Delete all paths (reset config)
export async function deleteAllPaths() {
  await writeConfig({}, PATH_CONFIG_FILE);
}

// Get the full config (optional helper)
export async function getConfig(type) {
  return await readConfig(type === "creds" ? CREDS_CONFIG_FILE : PATH_CONFIG_FILE);
}
