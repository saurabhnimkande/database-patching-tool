import { promises as fs } from "fs";
import path from "path";
import os from "os";

const CONFIG_DIR = path.join(os.homedir(), ".database-patching-tool-cli");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

/**
 * Ensures the config directory and file exist
 * @private
 */
async function ensureConfigFile() {
  await fs.mkdir(CONFIG_DIR, { recursive: true });

  try {
    await fs.access(CONFIG_FILE);
  } catch {
    // Create default config structure if file doesn't exist
    const defaultConfig = {
      db_creds: {},
      paths: {},
      schemaname: ''
    };
    await fs.writeFile(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
  }
}

/**
 * Reads the config file and returns its contents
 * @private
 * @returns {Promise<Object>} The config object
 */
async function readConfig() {
  await ensureConfigFile();
  const data = await fs.readFile(CONFIG_FILE, "utf-8");
  return JSON.parse(data);
}

/**
 * Writes data to the config file
 * @private
 * @param {Object} data - The data to write
 */
async function writeConfig(data) {
  await fs.writeFile(CONFIG_FILE, JSON.stringify(data, null, 2));
}

/**
 * Saves database credentials for a specific environment
 * @param {string} env - The environment name (e.g., 'dev', 'prod')
 * @param {Object} value - The credentials object
 */
export async function saveCreds(env, value) {
  const config = await readConfig();
  config.db_creds[env] = value;
  await writeConfig(config);
}

/**
 * Saves a path configuration
 * @param {string} pathName - The name of the path configuration
 * @param {string} value - The path value
 */
export async function savePath(pathName, value) {
  const config = await readConfig();
  config.paths[pathName] = value;
  await writeConfig(config);
}

/**
 * Saves the database schema name configuration
 * @param {string} schema - The schema name
 */
export async function saveSchemaName(schema) {
  const config = await readConfig();
  config.schemaname = schema;
  await writeConfig(config);
}

/**
 * Retrieves database credentials for a specific environment
 * @param {string} env - The environment name
 * @returns {Promise<Object|null>} The credentials object or null if not found
 */
export async function getCreds(env) {
  const config = await readConfig();
  return config.db_creds[env] || null;
}

/**
 * Retrieves a path configuration
 * @param {string} pathName - The name of the path configuration
 * @returns {Promise<string|null>} The path value or null if not found
 */
export async function getPath(pathName) {
  const config = await readConfig();
  return config.paths[pathName] || null;
}

/**
 * Retrieves the database schema name configuration
 * @returns {Promise<string>} The schema name
 */
export async function getSchemaName() {
  const config = await readConfig();
  return config.schemaname;
}

/**
 * Checks if credentials exist for a specific environment
 * @param {string} env - The environment name
 * @returns {Promise<boolean>} True if credentials exist
 */
export async function credsExist(env) {
  const config = await readConfig();
  return !!config.db_creds[env];
}

/**
 * Deletes credentials for a specific environment
 * @param {string} env - The environment name
 */
export async function deleteCreds(env) {
  const config = await readConfig();
  if (config.db_creds[env]) {
    delete config.db_creds[env];
    await writeConfig(config);
  }
}

/**
 * Deletes a path configuration
 * @param {string} pathName - The name of the path configuration
 */
export async function deletePath(pathName) {
  const config = await readConfig();
  if (config.paths[pathName]) {
    delete config.paths[pathName];
    await writeConfig(config);
  }
}

/**
 * Deletes all database credentials
 */
export async function deleteAllCreds() {
  const config = await readConfig();
  config.db_creds = {};
  await writeConfig(config);
}

/**
 * Deletes all path configurations
 */
export async function deleteAllPaths() {
  const config = await readConfig();
  config.paths = {};
  await writeConfig(config);
}

/**
 * Deletes the database schema name configuration
 */
export async function deleteSchemaName() {
  const config = await readConfig();
  config.schemaname = '';
  await writeConfig(config);
}

/**
 * Retrieves the entire configuration
 * @returns {Promise<Object>} The complete config object
 */
export async function getConfig() {
  return await readConfig();
}
