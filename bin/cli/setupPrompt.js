import figlet from "figlet";
import { pastel } from "gradient-string";
import { credsExist, saveCreds } from "../../utils/configManager.js";
import { validateDatabaseCredentials } from "../../utils/dbValidator.js";
import inquirer from "inquirer";
import { createSpinner } from "nanospinner";
import chalk from "chalk";
import setupAdditionalDetailsPrompt from "./setupAdditionalDetailsPrompt.js";
import path from "path";
import { fileURLToPath } from "url";

const sleep = (ms = 1000) => new Promise((r) => setTimeout(r, ms));

/**
 * Displays the welcome banner
 */
async function displayWelcomeBanner() {
  await figlet("database-patching-tool", (err, data) => {
    console.log(pastel.multiline(data));
  });
  console.log("\n");
  console.log("Please enter the database credentials : ");
  console.log("\n");
}

/**
 * Prompts for database credentials
 * @returns {Promise<Object>} The credentials object
 */
async function promptForCredentials() {
  const questions = [
    {
      type: "input",
      name: "env_name",
      message: "Please enter environment name",
      default: "dev_env",
      filter: (input) => input.trim(),
      async validate(value) {
        if (!value || value.length === 0) return "Please enter valid value";
        let isExists = await credsExist(value);
        if (!isExists) return true;
        return `Config already exists against ${value}`;
      },
    },
    {
      type: "input",
      name: "user",
      message: "Please enter database username",
      filter: (input) => input.trim(),
      validate(value) {
        if (!value || value.length === 0) return "Please enter valid value";
        return true;
      },
    },
    {
      type: "input",
      name: "host",
      message: "Please enter database host",
      filter: (input) => input.trim(),
      validate(value) {
        if (!value || value.length === 0) return "Please enter valid value";
        return true;
      },
    },
    {
      type: "input",
      name: "database",
      message: "Please enter database name",
      filter: (input) => input.trim(),
      validate(value) {
        if (!value || value.length === 0) return "Please enter valid value";
        return true;
      },
    },
    {
      type: "password",
      name: "password",
      message: "Please enter database password",
      mask: "*",
      validate(value) {
        if (!value || value.length === 0) return "Please enter valid value";
        return true;
      },
    },
    {
      type: "input",
      name: "port",
      message: "Please enter database port",
      default: "5432",
      filter: (input) => input.trim(),
      validate(value) {
        if (!value || value.length === 0) return "Please enter valid value";
        if (isNaN(value)) return "Please enter a valid port number";
        return true;
      },
    },
    {
      type: "confirm",
      name: "ssl",
      message: "Enable SSL connection?",
      default: true,
    },
  ];

  return await inquirer.prompt(questions);
}

/**
 * Prompts for path setup configuration
 * @returns {Promise<boolean>} Whether to proceed with path setup
 */
async function promptForPathSetup() {
  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: "Would you like to configure output paths and database schema details? This will help customize where files are saved and which schema to use.",
    },
  ]);

  return confirm;
}

/**
 * Handles the setup of a single environment's credentials
 * @param {Object} spinner - The spinner instance
 * @returns {Promise<boolean>} Whether to continue setting up more environments
 */
async function handleEnvironmentSetup(spinner) {
  let shouldRetry = true;
  let answers;

  while (shouldRetry) {
    try {
      answers = await promptForCredentials();
      const environmentName = answers.env_name;
      delete answers.env_name;

      spinner.start();
      const validation = await validateDatabaseCredentials(answers);
      
      if (!validation.success) {
        spinner.error();
        console.log(chalk.red(validation.message));
        console.log("\n");
        
        const { retry } = await inquirer.prompt([
          {
            type: "confirm",
            name: "retry",
            message: "Would you like to try again with different credentials?",
            default: true,
          },
        ]);

        if (!retry) {
          return false;
        }
        continue;
      }

      await saveCreds(environmentName, answers);
      spinner.success();
      console.log(chalk.green(`\n✅ Database credentials stored against '${environmentName}' environment name.\n`));

      const { setup_another } = await inquirer.prompt([
        {
          type: "confirm",
          name: "setup_another",
          message: "Would you like to setup credentials for another environment?",
          default: false,
        },
      ]);

      if (setup_another) {
        console.log("\n");
      }
      return setup_another;
    } catch (error) {
      if (error.message?.includes("User force closed the prompt")) {
        spinner.stop();
        console.log("\n👋 Setup cancelled by user.");
        process.exit(0);
      }
      
      spinner.error();
      console.log(chalk.red(error.message));
      console.log(chalk.red("Invalid credentials !!!"));
      console.log("\n");
      
      const { retry } = await inquirer.prompt([
        {
          type: "confirm",
          name: "retry",
          message: "Would you like to try again with different credentials?",
          default: true,
        },
      ]);

      if (!retry) {
        process.exit(0);
      }
    }
  }
}

/**
 * Main setup function that handles the entire setup process
 */
export default async function setupPrompt() {
  const spinner = createSpinner("Validating credentials...");
  const loading = createSpinner("Loading...");
  
  try {
    await displayWelcomeBanner();

    let setupMore = true;
    while (setupMore) {
      setupMore = await handleEnvironmentSetup(spinner);
    }

    const shouldSetupPaths = await promptForPathSetup();
    if (shouldSetupPaths) {
      loading.start();
      await sleep(1000);
      loading.stop();
      console.log("");
      setupAdditionalDetailsPrompt(true);
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
