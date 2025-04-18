import fs from "fs";
import PatchingManager from "../../utils/PatchingManager.js";
import path from "path";

/**
 * Generates SQL insert scripts to patch missing data from one database instance (`client1`) to another (`client2`).
 *
 * @param {Object} options - Configuration options for the patching process.
 * @param {string[]} options.tableNames - List of table names to process for data patching.
 * @param {Object} options.creds1 - Credentials for the source database (`client1`).
 * @param {string} options.creds1.user - Database username.
 * @param {string} options.creds1.host - Host address of the source database.
 * @param {string} options.creds1.database - Name of the source database.
 * @param {string} options.creds1.password - Password for the source database.
 * @param {number} options.creds1.port - Port number for the source database.
 * @param {boolean} [options.creds1.ssl=true] - Optional SSL configuration (default is `true`).
 *
 * @param {Object} options.creds2 - Credentials for the target database (`client2`).
 * @param {string} options.creds2.user - Database username.
 * @param {string} options.creds2.host - Host address of the target database.
 * @param {string} options.creds2.database - Name of the target database.
 * @param {string} options.creds2.password - Password for the target database.
 * @param {number} options.creds2.port - Port number for the target database.
 * @param {boolean} [options.creds2.ssl=true] - Optional SSL configuration (default is `true`).
 */
export default async function seedDataPatching({
  tableNames,
  schemaName,
  creds1,
  creds2,
  fileFormat,
  exportDir,
  tablesMetadataPath,
  seedingConfigMetadataPath,
}) {
  let client1 = {}; // qa client
  let client2 = {}; // demo client
  let mergeStatements = "";
  try {
    let patchingManager = new PatchingManager({ schemaName });
    await patchingManager.setUpDB({ creds1, creds2 });
    client1 = patchingManager.getClient1();
    client2 = patchingManager.getClient2();

    let tablesMetadata = fs.readFileSync(tablesMetadataPath, "utf8");
    let seedingConfigMetadata = fs.readFileSync(seedingConfigMetadataPath, "utf8");

    if (!tableNames) {
      tableNames = JSON.parse(tablesMetadata).map((el) => el.tableName);
    }

    for (let tableName of tableNames) {
      console.log("Processing data for table", tableName, "⏳");
      try {
        patchingManager.setUpMetadata({
          tableName,
          tablesMetadata: JSON.parse(tablesMetadata),
          seedingConfigMetadata: JSON.parse(seedingConfigMetadata),
        });
        let allColumns = await patchingManager.getAllColumns({ client: client1 });
        allColumns = patchingManager.removeInsertColumn({ data: allColumns });

        let allRowsDB1 = await patchingManager.getAllRows({ client: client1 });
        let allRowsDB2 = await patchingManager.getAllRows({ client: client2 });

        // compares data from db1 to db2
        let final = patchingManager.getDifference({ array1: allRowsDB1, array2: allRowsDB2 });
        let filteredDataFinal = patchingManager.removeColumnsFromResponse({ data: final });
        let finalData = await patchingManager.mapInsertScriptValue({ data: filteredDataFinal, columns: allColumns });
        let fileName = `./${tableName}_seed_data.sql`;
        if (finalData.length > 0) {
          let processedData = patchingManager.processInsertStatement({ finalData, columns: allColumns });
          if (fileFormat === "merge") {
            mergeStatements += `-- ${tableName}` + "\n" + processedData + "\n\n";
          } else {
            fs.writeFileSync(path.join(exportDir, fileName), processedData);
            console.log("Seed data file name", fileName, "📄");
          }
          console.log("Seed data extraction completed for", tableName, "✅");
        } else {
          console.log("Tables already up to date ✅, hence seeding not needed.");
        }
      } catch (error) {
        console.log(error);
        console.log("Error in processing data for", tableName, "❌");
      } finally {
        console.log("----------------------------------------------------------");
      }
    }
    if (fileFormat === "merge" && mergeStatements.length > 0) {
      fs.writeFileSync(path.join(exportDir, "./fntl_seed_data.sql"), mergeStatements);
    }
    if (client1.commitTransaction) await client1.commitTransaction();
    if (client2.commitTransaction) await client2.commitTransaction();
  } catch (error) {
    console.log("error", error);
    throw error;
  } finally {
    if (client1.endTransaction) await client1.endTransaction();
    if (client2.endTransaction) await client2.endTransaction();
  }
}
