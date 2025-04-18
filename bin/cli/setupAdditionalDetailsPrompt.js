import figlet from "figlet";
import { pastel } from "gradient-string";
import selectPathPrompt from "./selectPathPrompt.js";
import chalk from "chalk";
import inquirer from "inquirer";
import { saveSchemaName } from "../../utils/configManager.js";

/**
 * Prompts for schema name
 * @returns {Promise<string>} The schema name
 */
async function promptForSchemaName() {
  const { schemaName } = await inquirer.prompt([
    {
      type: "input",
      name: "schemaName",
      message: "Please enter the database schema name",
      default: "public",
      filter: (input) => input.trim(),
      validate(value) {
        if (!value || value.length === 0) return "Please enter a valid schema name";
        return true;
      },
    },
  ]);

  return schemaName;
}

/**
 * Prompts for optional file selection
 * @param {string} fileType - Type of file to select
 * @param {string} configKey - Configuration key to save the path
 * @param {string} message - Message to display
 */
async function promptForOptionalFile(fileType, configKey, message) {
  const { shouldSelect } = await inquirer.prompt([
    {
      type: "confirm",
      name: "shouldSelect",
      message: `Would you like to ${message.toLowerCase()}?`,
      default: false,
    },
  ]);

  if (shouldSelect) {
    await selectPathPrompt(fileType, configKey, message);
  }
}

/**
 * Main function to handle path setup
 * @param {boolean} isRef - Whether this is a reference call
 */
export default async function setupAdditionalDetailsPrompt(isRef) {
  try {
    if (!isRef) {
      await figlet("database-patching-tool", (err, data) => {
        console.log(pastel.multiline(data));
      });
      console.log("\n");
    }
    console.log("Please enter the following details: ");

    // Get schema name first
    const schemaName = await promptForSchemaName();
    await saveSchemaName(schemaName);
    console.log(chalk.white(chalk.bold("✔ Schema name")), chalk.cyan(schemaName));

    // Then get optional file paths
    await promptForOptionalFile("file", "seed_metadata_file_path", "Select seed metadata file");
    await promptForOptionalFile("file", "tables_metadata_file_path", "Select tables metadata file");
    await promptForOptionalFile("file", "views_order_file_path", "Select views order file");
    
    // Export directory is required
    await selectPathPrompt("directory", "export_dir_path", "Select output directory");

    console.log(chalk.green(`\n✅ Path details stored successfully.\n`));
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
