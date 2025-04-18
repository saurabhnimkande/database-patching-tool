import fs from "fs";
import PatchingManager from "../../utils/PatchingManager.js";
import path from "path";

/**
 * @function patchAllTablesSchema
 * @description
 * This function compares and patches the schema differences between two databases (DB1 and DB2).
 * It generates SQL scripts for creating or altering tables to sync the schema of DB2 with DB1.
 *
 *  **Process Overview:**
 * 1. **Setup:** Initialize PatchingManager and establish connections with DB1 (QA) and DB2 (Demo).
 * 2. **Fetch Tables:** Retrieve all table names from both databases.
 * 3. **Identify Differences:** Compare table lists to identify missing or altered tables.
 * 4. **Process Tables:**
 *    - If a table is missing in DB2, generate a `CREATE TABLE` script.
 *    - If a table exists but differs, generate `ALTER` scripts for:
 *      - Column differences
 *      - Constraint differences
 *      - Index differences
 * 5. **Script Generation:**
 *    - If `fileFormat` is `merge`, combine all scripts into:
 *      - `fntl_tables.sql` for `CREATE` scripts.
 *      - `fntl_alter.sql` for `ALTER` scripts.
 *    - Otherwise, save individual script files for each table.
 * 6. **Commit & Clean-up:** Commit or rollback transactions and close connections.
 *
 *  **Parameters:**
 * @param {Object} options - Configuration options
 * @param {string} options.tableSchema - The schema to be patched (e.g., 'public').
 * @param {string} options.fileFormat - Format of the generated SQL files ('merge' or 'individual').
 * @param {Object} options.creds1 - Database credentials for DB1.
 * @param {Object} options.creds2 - Database credentials for DB2.
 */
export default async function patchAllTablesSchema({ tableSchema, fileFormat, creds1, creds2, exportDir }) {
  let client1 = {}; // qa client
  let client2 = {}; // demo client
  let mergeStatements = "";
  let createStatements = "";
  let tablesStore = {};
  try {
    const patchingManager = new PatchingManager({ tableSchema });
    await patchingManager.setUpDB({ creds1, creds2 });
    client1 = patchingManager.getClient1();
    client2 = patchingManager.getClient2();

    let tablesDB1 = await patchingManager.getAllTables({ client: client1 });
    let tablesDB2 = await patchingManager.getAllTables({ client: client2 });
    let tablesDiff = patchingManager.getDifferenceByKey({ array1: tablesDB1, array2: tablesDB2, key: "tablename" });
    let tableNames = tablesDB1.map((el) => el.tablename);

    for (let tableName of tableNames) {
      let statments = [];
      try {
        patchingManager.setUpTableName({ tableName });

        let allColumnsDB1 = await patchingManager.getAllColumns({ client: client1 });
        let allColumnsDB2 = await patchingManager.getAllColumns({ client: client2 });

        let allConstraintsDB1 = await patchingManager.getAllConstraints({ client: client1 });
        let allConstraintsDB2 = await patchingManager.getAllConstraints({ client: client2 });

        let allIndexesDB1 = await patchingManager.getAllIndexes({ client: client1 });
        let allIndexesDB2 = await patchingManager.getAllIndexes({ client: client2 });

        if (tablesDiff.includes(tableName)) {
          console.log("Processing create table script for table", tableName, "⏳");
          allColumnsDB1 = patchingManager.reArrangeColumnsInOrder({ columns: allColumnsDB1, constraints: allConstraintsDB1 });

          let createTableScript = patchingManager.generateCreateTableScript({
            columns: allColumnsDB1,
            constraints: allConstraintsDB1,
            indexes: allIndexesDB1,
          });

          if (createTableScript.length > 0) {
            if (fileFormat === "merge") {
              createStatements += `-- ${tableName}` + "\n" + createTableScript + "\n\n";
              tablesStore[tableName] = {
                ref: patchingManager.extractForeignKeyTables({ constraints: allConstraintsDB1 }),
                definition: `-- ${tableName}` + "\n" + createTableScript + "\n\n",
              };
            } else {
              const fileName = `./${tableName}_create_table_script.sql`;
              fs.writeFileSync(path.join(exportDir, fileName), createTableScript);

              console.log("Create table script file name", fileName, "📄");
            }
            console.log("Create table script generation completed for", tableName, "✅");
          }
        } else {
          console.log("Processing alter script for table", tableName, "⏳");
          let alterScript1 = await patchingManager.compareColumnsAndGenerateAlterScripts({ array1: allColumnsDB1, array2: allColumnsDB2 });
          if (alterScript1.length > 0) statments.push(alterScript1);

          let alterScript2 = patchingManager.compareConstraintsAndGenerateAlterScripts({ array1: allConstraintsDB1, array2: allConstraintsDB2 });
          if (alterScript2.length > 0) statments.push(alterScript2);

          let alterScript3 = patchingManager.compareIndexesAndGenerateAlterScripts({ array1: allIndexesDB1, array2: allIndexesDB2 });
          if (alterScript3.length > 0) statments.push(alterScript3);

          if (statments.length > 0) {
            if (fileFormat === "merge") {
              mergeStatements += `-- ${tableName}` + "\n" + statments.join("\n\n") + "\n\n";
            } else {
              const fileName = `./${tableName}_alter_script.sql`;
              fs.writeFileSync(path.join(exportDir, fileName), statments.join("\n\n"));

              console.log("Alter script file name", fileName, "📄");
            }

            console.log("Alter script generation completed for", tableName, "✅");
          } else {
            console.log("Tables already up to date ✅, hence no alteration needed.");
          }
        }
      } catch (error) {
        console.log(error);
        console.log("Error in processing data for", tableName, "❌");
      } finally {
        console.log("----------------------------------------------------------");
      }
    }
    if (fileFormat === "merge" && mergeStatements.length > 0) {
      fs.writeFileSync(path.join(exportDir, './fntl_alter.sql'), mergeStatements);
    }

    if (fileFormat === "merge" && createStatements.length > 0) {
      let statementsOutput = patchingManager.processCreateTableOutput({ tablesMap: tablesStore });
      fs.writeFileSync(path.join(exportDir, "./fntl_tables_ordered.sql"), statementsOutput);
      fs.writeFileSync(path.join(exportDir, "./fntl_tables.sql"), createStatements);
    }

    patchingManager.measureExecutionTime();

    if (client1.commitTransaction) await client1.commitTransaction();
    if (client2.commitTransaction) await client2.commitTransaction();
  } catch (error) {
    console.log("error:", error);
    throw error;
  } finally {
    if (client1.endTransaction) await client1.endTransaction();
    if (client2.endTransaction) await client2.endTransaction();
  }
};
