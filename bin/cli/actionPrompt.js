import figlet from "figlet";
import { pastel } from "gradient-string";
import { getConfig } from "../../utils/configManager.js";
import inquirer from "inquirer";
import { createSpinner } from "nanospinner";
import chalk from "chalk";
import { getDatabaseConfig } from "../../utils/utils.js";
import patchAllTablesSchema from "../helper/patchAllTablesSchema.js";
import patchAllViews from "../helper/patchAllViews.js";
import seedDataPatching from "../helper/seedDataPatching.js";

const sleep = (ms = 1000) => new Promise((r) => setTimeout(r, ms));

export default async function actionPrompt() {
  const loading = createSpinner("Loading...");
  const fetching = createSpinner("Retrieving config data...");
  try {
    await figlet("pace-patching-tool", (err, data) => {
      console.log(pastel.multiline(data));
    });
    console.log("\n");
    fetching.start();
    await sleep(1000);

    let credsConfig = await getConfig("creds");
    let pathConfig = await getConfig("path");

    if (credsConfig && Object.keys(credsConfig).length > 1 && pathConfig && Object.keys(pathConfig).length === 4) {
      fetching.success("Retrieving config data... done.");
      console.log(chalk.white(chalk.bold(`Output directory path`)), chalk.cyan(pathConfig.export_dir_path));
      console.log(chalk.white(chalk.bold(`Seed metadata file path`)), chalk.cyan(pathConfig.seed_metadata_file_path));
      console.log(chalk.white(chalk.bold(`Tables metadata file path`)), chalk.cyan(pathConfig.tables_metadata_file_path));
      console.log(chalk.white(chalk.bold(`Drop views file path`)), chalk.cyan(pathConfig.drop_views_file_path));
      console.log("\n");
      console.log("Choose the environments you want to compare");

      const answer1 = await inquirer.prompt([
        {
          type: "list",
          name: "selectedEnv",
          message: "Choose the first environment",
          choices: Object.keys(credsConfig) ?? [],
        },
      ]);
      let secChoices = Object.keys(credsConfig).filter((el) => el !== answer1.selectedEnv) ?? [];
      secChoices.push("__skip__");
      const answer2 = await inquirer.prompt([
        {
          type: "list",
          name: "selectedEnv",
          message: "Choose the second environment",
          choices: secChoices,
        },
      ]);
      let shouldProceedMessage = "";
      if (answer2.selectedEnv === "__skip__") {
        shouldProceedMessage = "The database structure will be retrieved from the first environment.";
      } else {
        shouldProceedMessage = `Database patching will be done from ${chalk.green(answer1.selectedEnv)} (primary) to ${chalk.green(
          answer2.selectedEnv
        )}.`;
      }

      let shouldProceed = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: `${shouldProceedMessage} Would you like to proceed ?`,
        },
      ]);

      if (shouldProceed.confirm) {
        console.log("\n");
        const action = await inquirer.prompt([
          {
            type: "list",
            name: "actionName",
            message: "Select an action to perform on the database",
            choices: ["Patch table schemas", "Patch views", "Patch seed data"],
          },
        ]);

        loading.start();
        let creds1 = await getDatabaseConfig(credsConfig[answer1.selectedEnv]);
        let creds2;
        if (answer2.selectedEnv !== "__skip__") {
          creds2 = await getDatabaseConfig(credsConfig[answer2.selectedEnv]);
        }
        loading.stop();
        if (action.actionName === "Patch table schemas") {
          const fileFormat = await inquirer.prompt([
            {
              type: "list",
              name: "format",
              message: "Choose output format: single file or split into multiple files",
              choices: ["merge", "split"],
            },
          ]);
          console.log("\n");
          await patchAllTablesSchema({
            tableSchema: "public",
            fileFormat: fileFormat.format,
            creds1,
            creds2,
            exportDir: pathConfig.export_dir_path,
          });
        } else if (action.actionName === "Patch views") {
          console.log("\n");
          await patchAllViews({
            tableSchema: "public",
            sourceFilePath: pathConfig.drop_views_file_path,
            creds1,
            creds2,
            exportDir: pathConfig.export_dir_path,
          });
        } else if (action.actionName === "Patch seed data") {
          const fileFormat = await inquirer.prompt([
            {
              type: "list",
              name: "format",
              message: "Choose output format: single file or split into multiple files",
              choices: ["merge", "split"],
            },
          ]);
          console.log("\n");
          await seedDataPatching({
            tableSchema: "public",
            creds1,
            creds2,
            fileFormat: fileFormat.format, 
            exportDir: pathConfig.export_dir_path,
            tablesMetadataPath: pathConfig.tables_metadata_file_path,
            seedingConfigMetadataPath: pathConfig.seed_metadata_file_path,
          });
        }
      }
    } else {
      fetching.error("Error retrieving config data.\nPlease setup the configuration before proceeding.");
    }
    console.log("\n");
  } catch (err) {
    if (err.isTtyError) {
      console.error("⚠️ Prompt couldn’t be rendered in the current environment");
    } else if (err.message?.includes("User force closed the prompt")) {
      console.log("\n👋 Prompt cancelled by user.");
    } else {
      console.error("❌ Unexpected error:", err.message);
    }
    // eslint-disable-next-line no-undef
    process.exit(0);
  }
}
