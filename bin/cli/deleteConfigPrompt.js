import figlet from "figlet";
import { pastel } from "gradient-string";
import inquirer from "inquirer";
import { deleteCreds, deletePath, getConfig } from "../../utils/configManager.js";
import chalk from "chalk";

/**
 * Main function to handle configuration deletion
 * @param {string} type - Type of configuration to delete ('CREDS' or 'PATH')
 */
export default async function deleteConfigPrompt(type) {
  try {
    await figlet("database-patching-tool", (err, data) => {
      console.log(pastel.multiline(data));
    });
    console.log("\n");

    if (type === "CREDS") {
      console.log("Which environment would you like to delete?");
      console.log("\n");

      const configs = await getConfig();
      const choices = Object.keys(configs.db_creds);

      if (choices.length === 0) {
        console.log(chalk.yellow("No environments found to delete."));
        return;
      }

      const answer = await inquirer.prompt([
        {
          type: "list",
          name: "selectedEnv",
          message: "Select an environment to delete:",
          choices,
        },
      ]);

      await deleteCreds(answer.selectedEnv);
      console.log(chalk.green(`\n✅ Database credentials for the '${answer.selectedEnv}' environment have been deleted successfully.\n`));
    } else {
      console.log("Which path would you like to delete?");
      console.log("\n");

      const configs = await getConfig();
      const choices = Object.keys(configs.paths);

      if (choices.length === 0) {
        console.log(chalk.yellow("No paths found to delete."));
        return;
      }

      const answer = await inquirer.prompt([
        {
          type: "list",
          name: "selectedPath",
          message: "Select path to delete:",
          choices,
        },
      ]);

      await deletePath(answer.selectedPath);
      console.log(chalk.green(`\n✅ '${answer.selectedPath}' path has been deleted successfully.\n`));
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
