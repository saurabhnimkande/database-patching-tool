import figlet from "figlet";
import { pastel } from "gradient-string";
import { getConfig } from "../../utils/configManager.js";
import inquirer from "inquirer";
import { createSpinner } from "nanospinner";
import chalk from "chalk";
import { getDatabaseConfig } from "../../utils/utils.js";
import patchTableSchema from "../helper/patchTableSchema.js";
import PatchingManager from "../../utils/PatchingManager.js";
import fs from "fs";
import path from "path";
import seedDataPatching from "../helper/seedDataPatching.js";

const sleep = (ms = 1000) => new Promise((r) => setTimeout(r, ms));

export default async function singleTableActions(tableName, actionName) {
  if (!tableName || !actionName) {
    throw new Error("Table name and action name are required parameters");
  }

  // Validate actionName
  const validActions = [
    "Generate table alter script",
    "Generate table DDL",
    "Generate seed data script"
  ];
  
  if (!validActions.includes(actionName)) {
    throw new Error(`Invalid action. Must be one of: ${validActions.join(", ")}`);
  }

  const loading = createSpinner("Loading...");
  const fetching = createSpinner("Retrieving config data...");
  let client1 = {};
  let client2 = {};
  
  try {
    await figlet("pace-patching-tool", (err, data) => {
      console.log(pastel.multiline(data));
    });
    console.log("\n");
    fetching.start();
    await sleep(1000);

    let credsConfig = await getConfig("creds");
    let pathConfig = await getConfig("path");

    // Validate configurations based on action
    if (!credsConfig || !pathConfig) {
      throw new Error("Configuration files not found");
    }

    if (actionName === "Generate table alter script" && Object.keys(credsConfig).length < 2) {
      throw new Error("At least two environments are required in credentials configuration for generating alter scripts");
    }

    if (!pathConfig || Object.keys(pathConfig).length !== 4) {
      throw new Error("Invalid path configuration. Expected 4 path configurations.");
    }

    if (credsConfig && Object.keys(credsConfig).length > 0 && pathConfig && Object.keys(pathConfig).length === 4) {
      fetching.success("Retrieving config data... done.");
      console.log(chalk.white(chalk.bold(`Output directory path`)), chalk.cyan(pathConfig.export_dir_path));
      console.log(chalk.white(chalk.bold(`Seed metadata file path`)), chalk.cyan(pathConfig.seed_metadata_file_path));
      console.log(chalk.white(chalk.bold(`Tables metadata file path`)), chalk.cyan(pathConfig.tables_metadata_file_path));
      console.log("\n");
      console.log("Choose the environments");

      const answer1 = await inquirer.prompt([
        {
          type: "list",
          name: "selectedEnv",
          message: "Choose the first environment",
          choices: Object.keys(credsConfig) ?? [],
        },
      ]);
      
      // Only prompt for second environment if needed
      let answer2;
      if (actionName !== "Generate table DDL") {
        // For alter script, we don't allow skipping the second environment
        let secChoices = Object.keys(credsConfig).filter((el) => el !== answer1.selectedEnv) ?? [];
        
        answer2 = await inquirer.prompt([
          {
            type: "list",
            name: "selectedEnv",
            message: "Choose the second environment",
            choices: actionName === "Generate table alter script" ? secChoices : [...secChoices, "__skip__"],
          },
        ]);
      }

      // Get database credentials
      loading.start();
      let creds1 = await getDatabaseConfig(credsConfig[answer1.selectedEnv]);
      let creds2;
      if (answer2 && answer2.selectedEnv !== "__skip__") {
        creds2 = await getDatabaseConfig(credsConfig[answer2.selectedEnv]);
      }
      loading.stop();

      // Initialize PatchingManager for table validation
      const patchingManager = new PatchingManager({ tableSchema: "public" });
      // Only set up second DB connection if needed
      await patchingManager.setUpDB({ 
        creds1, 
        creds2: actionName !== "Generate table DDL" ? creds2 : undefined 
      });
      client1 = patchingManager.getClient1();
      client2 = patchingManager.getClient2();

      // Validate table existence
      patchingManager.setUpTableName({ tableName });
      const tablesDB1 = await patchingManager.getAllTables({ client: client1 });
      const tableExistsInDB1 = tablesDB1.some(t => t.tablename === tableName);

      if (!tableExistsInDB1) {
        throw new Error(`Table '${tableName}' does not exist in the first environment (${answer1.selectedEnv})`);
      }

      // Only validate second environment if needed
      if (actionName === "Generate table alter script" || (actionName === "Generate seed data script" && answer2?.selectedEnv !== "__skip__")) {
        const tablesDB2 = await patchingManager.getAllTables({ client: client2 });
        const tableExistsInDB2 = tablesDB2.some(t => t.tablename === tableName);
        if (!tableExistsInDB2) {
          throw new Error(`Table '${tableName}' does not exist in the second environment (${answer2.selectedEnv})`);
        }
      }

      // Perform the selected action
      console.log("\n");
      switch (actionName) {
        case "Generate table alter script":
          if (!creds2) {
            throw new Error("Second environment is required for generating alter scripts");
          }
          await patchTableSchema({
            tableNames: [tableName],
            tableSchema: "public",
            creds1,
            creds2,
            exportDir: pathConfig.export_dir_path
          });
          break;
        
        case "Generate table DDL": {
          // Use PatchingManager to generate DDL
          const columns = await patchingManager.getAllColumns({ client: client1 });
          const constraints = await patchingManager.getAllConstraints({ client: client1 });
          const indexes = await patchingManager.getAllIndexes({ client: client1 });
          
          const ddlScript = patchingManager.generateCreateTableScript({
            columns,
            constraints,
            indexes
          });

          const ddlFileName = `./${tableName}_ddl.sql`;
          fs.writeFileSync(path.join(pathConfig.export_dir_path, ddlFileName), ddlScript);
          console.log(chalk.green(`DDL script generated successfully: ${ddlFileName}`));
          break;
        }
        
        case "Generate seed data script":
          if (!fs.existsSync(pathConfig.tables_metadata_file_path)) {
            throw new Error("Tables metadata file not found");
          }
          if (!fs.existsSync(pathConfig.seed_metadata_file_path)) {
            throw new Error("Seed metadata file not found");
          }
          await seedDataPatching({
            tableNames: [tableName],
            tableSchema: "public",
            creds1,
            creds2,
            fileFormat: "split",
            exportDir: pathConfig.export_dir_path,
            tablesMetadataPath: pathConfig.tables_metadata_file_path,
            seedingConfigMetadataPath: pathConfig.seed_metadata_file_path
          });
          break;
      }

      // Commit transactions if successful
      if (client1.commitTransaction) await client1.commitTransaction();
      if (client2.commitTransaction) await client2.commitTransaction();

    } else {
      fetching.error("Error retrieving config data.\nPlease setup the configuration before proceeding.");
    }
  } catch (err) {
    // Rollback in case of error
    if (client1.rollbackTransaction) await client1.rollbackTransaction();
    if (client2.rollbackTransaction) await client2.rollbackTransaction();

    if (err.isTtyError) {
      console.error("⚠️ Prompt couldn't be rendered in the current environment");
    } else if (err.message?.includes("User force closed the prompt")) {
      console.log("\n👋 Prompt cancelled by user.");
    } else {
      console.error("❌ Unexpected error:", err.message);
    }
    // eslint-disable-next-line no-undef
    process.exit(0);
  } finally {
    // Always end transactions, regardless of success or failure
    if (client1.endTransaction) await client1.endTransaction();
    if (client2.endTransaction) await client2.endTransaction();
  }
} 