import figlet from "figlet";
import { pastel } from "gradient-string";
import selectPathPrompt from "./selectPathPrompt.js";
import chalk from "chalk";
import path from "path";
import { fileURLToPath } from "url";
import { savePath } from "../../utils/configManager.js";

export default async function setupPathPrompt(isRef, setDefault) {
  try {
    if (!isRef) {
      await figlet("pace-patching-tool", (err, data) => {
        console.log(pastel.multiline(data));
      });
      console.log("\n");
    }
    console.log("Please enter the following detils : ");

    if (setDefault) {
      const __dirname = path.dirname(fileURLToPath(import.meta.url));

      let seedMetadataPath = path.join(__dirname, "../../metadata/seedingConfigMetadata.json");
      await savePath("seed_metadata_file_path", seedMetadataPath);
      console.log(chalk.white(chalk.bold("✔ Select seed metadata file (default)")), chalk.cyan(seedMetadataPath));

      let tablesMetadataPath = path.join(__dirname, "../../metadata/tablesMetadata.json");
      await savePath("tables_metadata_file_path", seedMetadataPath);
      console.log(chalk.white(chalk.bold("✔ Select tables metadata file (default)")), chalk.cyan(tablesMetadataPath));

      let dropViewsPath = path.join(__dirname, "../../src/fntl_drop_views.sql");
      await savePath("drop_views_file_path", seedMetadataPath);
      console.log(chalk.white(chalk.bold("✔ Select drop views file (default)")), chalk.cyan(dropViewsPath));
    } else {
      await selectPathPrompt("file", "seed_metadata_file_path", "Select seed metadata file");
      await selectPathPrompt("file", "tables_metadata_file_path", "Select tables metadata file");
      await selectPathPrompt("file", "drop_views_file_path", "Select drop views file");
    }
    await selectPathPrompt("directory", "export_dir_path", "Select output directory");

    console.log(chalk.green(`\n✅ Path detils stored successfully.\n`));
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
