import figlet from "figlet";
import { pastel } from "gradient-string";
import inquirer from "inquirer";
import { deleteCred, deletePath, getConfig } from "../../utils/configManager.js";
import chalk from "chalk";

export default async function deleteConfigPrompt(type) {
  try {
    await figlet("pace-patching-tool", (err, data) => {
      console.log(pastel.multiline(data));
    });
    console.log("\n");
    if (type === "CREDS") {
      console.log("Which environment would you like to delete ?");
      console.log("\n");

      let configs = await getConfig("creds");

      const answer = await inquirer.prompt([
        {
          type: "list",
          name: "selectedEnv",
          message: "Select an environment to delete:",
          choices: Object.keys(configs) ?? [],
        },
      ]);

      await deleteCred(answer.selectedEnv);
      console.log(chalk.green(`\n✅ Azure Key Vault credentials for the '${answer.selectedEnv}' environment have been deleted successfully...\n`));
    } else {
      console.log("Which path would you like to delete ?");
      console.log("\n");

      let configs = await getConfig("path");

      const answer = await inquirer.prompt([
        {
          type: "list",
          name: "selectedPath",
          message: "Select path to delete",
          choices: Object.keys(configs) ?? [],
        },
      ]);

      await deletePath(answer.selectedPath);
      console.log(chalk.green(`\n✅ '${answer.selectedPath}' path have been deleted successfully...\n`));
    }
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
