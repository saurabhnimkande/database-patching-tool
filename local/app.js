import patchAllTablesSchema from "../bin/helper/patchAllTablesSchema.js";
import patchAllViews from "../bin/helper/patchAllViews.js";
import patchTableSchema from "../bin/helper/patchTableSchema.js";
import seedDataPatching from "../bin/helper/seedDataPatching.js";
import { db1Creds, db2Creds } from "../common/keys.js";

let creds1 = {
  user: db1Creds.user,
  host: db1Creds.host,
  database: db1Creds.database,
  password: db1Creds.password,
  port: db1Creds.port,
  ssl: db1Creds.ssl ?? true,
};

let creds2 = {
  user: db2Creds.user,
  host: db2Creds.host,
  database: db2Creds.database,
  password: db2Creds.password,
  port: db2Creds.port,
  ssl: db2Creds.ssl ?? true,
};
// let tablesToSeed = ["fntl_answer_risks", "fntl_answer_scores", "fntl_answer_triggers", "fntl_answers", "fntl_configuration_mapping", "fntl_currencies", "fntl_document_categories", "fntl_document_folder_master", "fntl_global_resources", "fntl_json_column_key_mapping", "fntl_json_objects", "fntl_kpi_thresholds", "fntl_kpis", "fntl_lookup_types", "fntl_lookup_values", "fntl_mappings", "fntl_meta_approval_levels", "fntl_meta_wf", "fntl_meta_wf_attributes", "fntl_meta_wf_contexts", "fntl_meta_wf_mappings", "fntl_meta_wf_outcomes", "fntl_meta_wf_stage_outcomes", "fntl_meta_wf_stage_recipients", "fntl_meta_wf_stages", "fntl_org_configurations", "fntl_org_hierarchy_types", "fntl_org_types", "fntl_period_status", "fntl_period_types", "fntl_permission_sets", "fntl_plan_types", "fntl_portfolio_criteria", "fntl_portfolio_details", "fntl_portfolios", "fntl_questionnaire_contexts", "fntl_questionnaire_templates", "fntl_questions", "fntl_risks", "fntl_securing_functions", "fntl_serverless_objects", "fntl_set_functions", "fntl_status_transitions", "fntl_triggers", "fntl_views"]

seedDataPatching({
  tableNames: ["fntl_business_events"],
  tableSchema: "public",
  creds1,
  creds2,
  fileFormat: "merge",
  exportDir: "/Users/saurabhnimkande/frontrol/pace-patching-tool/exports",
  tablesMetadataPath: "/Users/saurabhnimkande/frontrol/pace-patching-tool/metadata/tablesMetadata.json",
  seedingConfigMetadataPath: "/Users/saurabhnimkande/frontrol/pace-patching-tool/metadata/seedingConfigMetadata.json",
});
patchTableSchema({
  tableNames: ["fntl_project_fundings"],
  tableSchema: "public",
  creds1,
  creds2,
  exportDir: "/Users/saurabhnimkande/frontrol/pace-patching-tool/exports",
});
patchAllTablesSchema({
  tableSchema: "public",
  fileFormat: "split",
  creds1,
  creds2,
  exportDir: "/Users/saurabhnimkande/frontrol/pace-patching-tool/exports",
});
patchAllViews({
  tableSchema: "public",
  sourceFilePath: "../src/fntl_drop_views.sql",
  creds1,
  creds2,
  exportDir: "/Users/saurabhnimkande/frontrol/pace-patching-tool/exports",
});
