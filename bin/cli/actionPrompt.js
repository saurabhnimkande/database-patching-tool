import figlet from "figlet";
import { pastel } from "gradient-string";
import { getConfig } from "../../utils/configManager.js";
import inquirer from "inquirer";
import { createSpinner } from "nanospinner";
import chalk from "chalk";
import patchAllTablesSchema from "../helper/patchAllTablesSchema.js";
import patchAllViews from "../helper/patchAllViews.js";
import seedDataPatching from "../helper/seedDataPatching.js";

const sleep = (ms = 1000) => new Promise((r) => setTimeout(r, ms));

/**
 * Displays the welcome banner
 */
async function displayWelcomeBanner() {
  await figlet("database-patching-tool", (err, data) => {
    console.log(pastel.multiline(data));
  });
  console.log("\n");
}

/**
 * Displays the current configuration
 * @param {Object} pathConfig - Path configuration object
 */
function displayConfiguration(pathConfig) {
  console.log(chalk.white(chalk.bold("Current Configuration:")));
  console.log(chalk.white(chalk.bold("Output directory path:")), chalk.cyan(pathConfig.export_dir_path));
  if (pathConfig.seed_metadata_file_path) {
    console.log(chalk.white(chalk.bold("Seed metadata file path:")), chalk.cyan(pathConfig.seed_metadata_file_path));
  }
  if (pathConfig.tables_metadata_file_path) {
    console.log(chalk.white(chalk.bold("Tables metadata file path:")), chalk.cyan(pathConfig.tables_metadata_file_path));
  }
  if (pathConfig.views_order_file_path) {
    console.log(chalk.white(chalk.bold("Views order file path:")), chalk.cyan(pathConfig.views_order_file_path));
  }
  console.log("\n");
}

/**
 * Prompts for environment selection
 * @param {Object} credsConfig - Credentials configuration object
 * @returns {Promise<Object>} Selected environments
 */
async function promptForEnvironments(credsConfig) {
  console.log("Choose the environments you want to compare");
  console.log("\n");

  const answer1 = await inquirer.prompt([
    {
      type: "list",
      name: "selectedEnv",
      message: "Choose the first environment",
      choices: Object.keys(credsConfig.db_creds),
    },
  ]);

  const secChoices = Object.keys(credsConfig.db_creds)
    .filter((el) => el !== answer1.selectedEnv);
  secChoices.push("__skip__");

  const answer2 = await inquirer.prompt([
    {
      type: "list",
      name: "selectedEnv",
      message: "Choose the second environment",
      choices: secChoices,
    },
  ]);

  return {
    primary: answer1.selectedEnv,
    secondary: answer2.selectedEnv,
  };
}

/**
 * Prompts for action selection
 * @returns {Promise<string>} Selected action
 */
async function promptForAction() {
  const { actionName } = await inquirer.prompt([
    {
      type: "list",
      name: "actionName",
      message: "Select an action to perform on the database",
      choices: ["Patch table schemas", "Patch views", "Patch seed data"],
    },
  ]);
  return actionName;
}

/**
 * Handles the patching action based on user selection
 * @param {Object} params - Parameters for patching
 * @param {string} params.action - Selected action
 * @param {Object} params.creds1 - Primary environment credentials
 * @param {Object} params.creds2 - Secondary environment credentials
 * @param {Object} params.pathConfig - Path configuration
 */
async function handlePatchingAction({ action, creds1, creds2, pathConfig }) {

  try {

    switch (action) {
      case "Patch table schemas":
        const schemaFormat = await inquirer.prompt([
          {
            type: "list",
            name: "format",
            message: "Choose output format:",
            choices: ["merge", "split"],
          },
        ]);
        console.log("\n");
        await patchAllTablesSchema({
          schemaName: pathConfig.schemaname || "public",
          fileFormat: schemaFormat.format,
          creds1,
          creds2,
          exportDir: pathConfig.export_dir_path,
        });
        break;

      case "Patch views":
        if (!pathConfig.views_order_file_path) {
          throw new Error("Views order file path is not configured. Please set it up first.");
        }
        console.log("\n");
        await patchAllViews({
          schemaName: pathConfig.schemaname || "public",
          sourceFilePath: pathConfig.views_order_file_path,
          creds1,
          creds2,
          exportDir: pathConfig.export_dir_path,
        });
        break;

      case "Patch seed data":
        if (!pathConfig.seed_metadata_file_path || !pathConfig.tables_metadata_file_path) {
          throw new Error("Seed metadata or tables metadata file paths are not configured. Please set them up first.");
        }
        const seedFormat = await inquirer.prompt([
          {
            type: "list",
            name: "format",
            message: "Choose output format:",
            choices: ["merge", "split"],
          },
        ]);
        console.log("\n");
        await seedDataPatching({
          schemaName: pathConfig.schemaname || "public",
          creds1,
          creds2,
          fileFormat: seedFormat.format,
          exportDir: pathConfig.export_dir_path,
          tablesMetadataPath: pathConfig.tables_metadata_file_path,
          seedingConfigMetadataPath: pathConfig.seed_metadata_file_path,
        });
        break;
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Main function to handle database patching actions
 */
export default async function actionPrompt() {
  const fetching = createSpinner("Retrieving config data...");
  
  try {
    await displayWelcomeBanner();
    fetching.start();
    await sleep(1000);

    const config = await getConfig();
    const { db_creds: credsConfig, paths: pathConfig } = config;

    if (!credsConfig || Object.keys(credsConfig).length === 0) {
      fetching.error();
      console.log(chalk.red("No database credentials found. Please set up credentials first."));
      return;
    }

    fetching.success();
    displayConfiguration(pathConfig);

    // Get action first
    const selectedAction = await promptForAction();
    console.log("\n");

    // Then get environments
    const environments = await promptForEnvironments(config);
    const shouldProceedMessage = environments.secondary === "__skip__"
      ? "The patching will be done from the first environment."
      : `Database patching will be done from ${chalk.green(environments.primary)} (primary) to ${chalk.green(environments.secondary)}.`;

    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: `${shouldProceedMessage} Would you like to proceed?`,
      },
    ]);

    if (confirm) {
      await handlePatchingAction({
        action: selectedAction,
        creds1: credsConfig[environments.primary],
        creds2: environments.secondary !== "__skip__" ? credsConfig[environments.secondary] : null,
        pathConfig,
      });
    }
  } catch (err) {
    if (err.isTtyError) {
      console.error("⚠️ Prompt couldn't be rendered in the current environment");
    } else if (err.message?.includes("User force closed the prompt")) {
      console.log("\n👋 Prompt cancelled by user.");
    } else {
      console.error("❌ Unexpected error:", err.message);
    }
    process.exit(0);
  }
}
