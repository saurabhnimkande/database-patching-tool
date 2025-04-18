import figlet from "figlet";
import { pastel } from "gradient-string";
import { keyExists, saveCreds } from "../../utils/configManager.js";
import inquirer from "inquirer";
import TenantCredentials from "../../utils/TenantCredentials.js";
import { createSpinner } from "nanospinner";
import chalk from "chalk";
import setupPathPrompt from "./setupPathPrompt.js";

const sleep = (ms = 1000) => new Promise((r) => setTimeout(r, ms));

export default async function setupPrompt() {
  const spinner = createSpinner("Validating credentials...");
  const loading = createSpinner("Loading...");
  try {
    await figlet("pace-patching-tool", (err, data) => {
      console.log(pastel.multiline(data));
    });
    console.log("\n");
    console.log("Please enter the keyvault credentials : ");
    console.log("\n");

    const questions = [
      {
        type: "input",
        name: "ENVIRONMENT_NAME",
        message: "Please enter environment name",
        default: "dev_env",
        filter: (input) => input.trim(),
        async validate(value) {
          if (!value || value.length === 0) return "Please enter valid value";
          let isExists = await keyExists(value);
          if (!isExists) return true;
          return `Config already exists against ${value}`;
        },
      },
      {
        type: "input",
        name: "PLATFORM_TENANT_ID",
        message: "Please enter platform tenant id (PLATFORM_TENANT_ID)",
        filter: (input) => input.trim(),
        validate(value) {
          if (!value || value.length === 0) return "Please enter valid value";
          return true;
        },
      },
      {
        type: "input",
        name: "VAULT_ENV",
        message: "Please enter vault env (VAULT_ENV)",
        filter: (input) => input.trim(),
        validate(value) {
          if (!value || value.length === 0) return "Please enter valid value";
          return true;
        },
      },
      {
        type: "input",
        name: "KEY_VAULT_NAME",
        message: "Please enter key vault name (KEY_VAULT_NAME)",
        filter: (input) => input.trim(),
        validate(value) {
          if (!value || value.length === 0) return "Please enter valid value";
          return true;
        },
      },
      {
        type: "input",
        name: "SERVICE_PRINCIPAL_TENANT_ID",
        message: "Please enter service principal tenant id (SERVICE_PRINCIPAL_TENANT_ID)",
        filter: (input) => input.trim(),
        validate(value) {
          if (!value || value.length === 0) return "Please enter valid value";
          return true;
        },
      },
      {
        type: "input",
        name: "SERVICE_PRINCIPAL_CLIENT_ID",
        message: "Please enter service principal client id (SERVICE_PRINCIPAL_CLIENT_ID)",
        filter: (input) => input.trim(),
        validate(value) {
          if (!value || value.length === 0) return "Please enter valid value";
          return true;
        },
      },
      {
        type: "input",
        name: "SERVICE_PRINCIPAL_CLIENT_SECRET",
        message: "Please enter service principal_client_secret (SERVICE_PRINCIPAL_CLIENT_SECRET)",
        filter: (input) => input.trim(),
        validate(value) {
          if (!value || value.length === 0) return "Please enter valid value";
          return true;
        },
      },
    ];

    let answers = await inquirer.prompt(questions);
    let environmentName = answers.ENVIRONMENT_NAME;
    delete answers.ENVIRONMENT_NAME;

    try {
      const {
        PLATFORM_TENANT_ID: tenantId,
        VAULT_ENV: tenantKey,
        KEY_VAULT_NAME: azureKVName,
        SERVICE_PRINCIPAL_TENANT_ID: servicePrincipalTenantId,
        SERVICE_PRINCIPAL_CLIENT_ID: servicePrincipalClientId,
        SERVICE_PRINCIPAL_CLIENT_SECRET: servicePrincipalClientSecret,
      } = answers;
      const tenantCreds = new TenantCredentials({ tenantId, tenantKey });
      tenantCreds.setup({
        servicePrincipalTenantId,
        servicePrincipalClientId,
        servicePrincipalClientSecret,
        azureKVName,
      });
      spinner.start();
      await tenantCreds.getTenantCreds("be_env");
      spinner.success();
      await saveCreds(environmentName, answers);
      console.log(chalk.green(`\n✅ Azure key vault credentials stored against '${environmentName}' environment name.\n`));

      let shouldProceedPath = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: "Would you like to setup path details ?",
        },
        {
          type: "confirm",
          name: "default",
          message: "Would you like to setup default value for input files ?",
        },
      ]);
      if (shouldProceedPath.confirm) {
        loading.start();
        await sleep(1000);
        loading.stop();
        console.log("");
        setupPathPrompt(true, shouldProceedPath.default);
      }
    } catch (error) {
      spinner.error();
      console.log(chalk.red(error.message));
      console.log(chalk.red("Invalid credentials !!!"));
      // eslint-disable-next-line no-undef
      process.exit(0);
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
