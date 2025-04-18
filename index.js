#!/usr/bin/env node
import { Command } from "commander";
import setupPrompt from "./bin/cli/setupPrompt.js";
import setupPathPrompt from "./bin/cli/setupPathPrompt.js";
import actionPrompt from "./bin/cli/actionPrompt.js";
import deleteConfigPrompt from "./bin/cli/deleteConfigPrompt.js";
import { deleteAllCreds, deleteAllPaths } from "./utils/configManager.js";
import singleTableActions from "./bin/cli/singleTableActions.js";

const program = new Command();

program.name("dbpt").description("CLI tool to manage DB patching").version("1.0.0");

program
  .command("setup-credentials")
  .description("Setup azure key vault")
  .action(() => {
    setupPrompt();
  });

program
  .command("setup-path")
  .description("Setup the patching output path")
  .option("-d, --default", "Use default paths")
  .action((options) => {
    setupPathPrompt(false, options.default || false);
  });

program
  .command("start")
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

// eslint-disable-next-line no-undef
program.parse(process.argv);
