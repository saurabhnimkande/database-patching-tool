import fileSelector from "inquirer-file-selector";
import chalk from "chalk";
import { savePath } from "../../utils/configManager.js";

export default async function selectPathPrompt(type, objectName, objectDescription) {
  try {
    const filePath = await fileSelector({
      message: chalk.white(objectDescription),
      type,
    });
    await savePath(objectName, filePath);
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
