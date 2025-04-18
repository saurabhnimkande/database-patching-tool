#!/usr/bin/env node
import { Command } from "commander";
import setupPrompt from "./bin/cli/setupPrompt.js";
import setupAdditionalDetailsPrompt from "./bin/cli/setupAdditionalDetailsPrompt.js";
import actionPrompt from "./bin/cli/actionPrompt.js";
import deleteConfigPrompt from "./bin/cli/deleteConfigPrompt.js";
import { deleteAllCreds, deleteAllPaths, deleteSchemaName } from "./utils/configManager.js";
import singleTableActions from "./bin/cli/singleTableActions.js";

const program = new Command();

program.name("dpt").description("CLI tool to manage DB patching").version("1.0.0");

program
  .command("setup")
  .description("Setup the required configuration details")
  .option("-a, --additional", "Setup additional details")
  .action((options) => {
    if (options.additional) {
      setupAdditionalDetailsPrompt(false);
    } else {
      setupPrompt();
    }
  });

program
  .command("patch")
  .description("Start the database patching process")
  .action(() => {
    actionPrompt();
  });

  program
  .command("clear-credentials")
  .description("Clear stored credentials")
  .option("-a, --all", "Clear all credentials")
  .action((options) => {
    if (options.all) {
      deleteAllCreds();
      console.log("Successfully cleared all saved credentials ✅");
    } else {
      deleteConfigPrompt("CREDS");
    }
  });

program
  .command("clear-paths")
  .description("Clear stored paths")
  .option("-a, --all", "Clear all credentials")
  .action((options) => {
    if (options.all) {
      deleteAllPaths();
      console.log("Successfully cleared all saved paths ✅");
    } else {
      deleteConfigPrompt("PATH");
    }
  });


// New commands for single table operations
program
  .command("generate-alter")
  .description("Generate alter script for a single table")
  .argument("<table-name>", "Name of the table")
  .action((tableName) => {
    singleTableActions(tableName, "Generate table alter script");
  });

program
  .command("generate-ddl")
  .description("Generate DDL script for a single table")
  .argument("<table-name>", "Name of the table")
  .action((tableName) => {
    singleTableActions(tableName, "Generate table DDL");
  });

program
  .command("generate-seed")
  .description("Generate seed data script for a single table")
  .argument("<table-name>", "Name of the table")
  .action((tableName) => {
    singleTableActions(tableName, "Generate seed data script");
  });

// Combined command with operation choice
program
  .command("table")
  .description("Perform operations on a single table")
  .argument("<table-name>", "Name of the table")
  .option("-a, --alter", "Generate alter script")
  .option("-d, --ddl", "Generate DDL script")
  .option("-s, --seed", "Generate seed data script")
  .action((tableName, options) => {
    if (options.alter) {
      singleTableActions(tableName, "Generate table alter script");
    } else if (options.ddl) {
      singleTableActions(tableName, "Generate table DDL");
    } else if (options.seed) {
      singleTableActions(tableName, "Generate seed data script");
    } else {
      console.error("Please specify an operation: --alter, --ddl, or --seed");
      // eslint-disable-next-line no-undef
      process.exit(1);
    }
  });

  program
  .command("clear-all")
  .description("Clear all configuration details")
  .option("-c, --credentials", "Clear credentials")
  .option("-p, --paths", "Clear paths")
  .option("-s, --schema", "Clear schema")
  .action(async (options) => {
    if (options.credentials) {
      await deleteAllCreds();
      console.log("Successfully cleared all saved credentials ✅");
    } else if (options.paths) {
      await deleteAllPaths();
      console.log("Successfully cleared all saved paths ✅");
    } else if (options.schema) {
      await deleteSchemaName();
      console.log("Successfully cleared all saved schema ✅");
    } else {
      await deleteAllCreds();
      await deleteAllPaths();
      await deleteSchemaName();
      console.log("Successfully cleared all saved configuration details ✅");
      // eslint-disable-next-line no-undef
      process.exit(0);
    }
  });

  program
  .command("clear")
  .description("Clear single configuration detail")
  .option("-c, --credentials", "Clear credentials")
  .option("-p, --paths", "Clear paths")
  .option("-s, --schema", "Clear schema")
  .action(async (options) => {
    if (options.credentials) {
      await deleteConfigPrompt("CREDS");
    } else if (options.paths) {
      await deleteConfigPrompt("PATH");
    } else if (options.schema) {
      await deleteSchemaName();
      console.log("Successfully cleared all saved schema ✅");
    } else {
      console.error("Please specify an operation: --credentials, --paths, or --schema");
      // eslint-disable-next-line no-undef
      process.exit(1);  
    }
  });

// eslint-disable-next-line no-undef
program.parse(process.argv);
