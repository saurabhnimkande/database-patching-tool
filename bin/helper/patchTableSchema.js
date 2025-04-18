import fs from "fs";
import PatchingManager from "../../utils/PatchingManager.js";
import path from "path";

export default async function patchTableSchema({ tableNames, tableSchema, creds1, creds2, exportDir }) {
  let client1 = {}; // qa client
  let client2 = {}; // demo client
  try {
    let patchingManager = new PatchingManager({ tableSchema });
    await patchingManager.setUpDB({ creds1, creds2 });
    client1 = patchingManager.getClient1();
    client2 = patchingManager.getClient2();
    for (let tableName of tableNames) {
      let statments = [];
      console.log("Processing alter script for table", tableName, "⏳");
      try {
        patchingManager.setUpTableName({ tableName });

        let allColumnsDB1 = await patchingManager.getAllColumns({ client: client1 });
        let allColumnsDB2 = await patchingManager.getAllColumns({ client: client2 });
        let alterScript1 = await patchingManager.compareColumnsAndGenerateAlterScripts({ array1: allColumnsDB1, array2: allColumnsDB2 });
        if (alterScript1.length > 0) statments.push(alterScript1);

        let allConstraintsDB1 = await patchingManager.getAllConstraints({ client: client1 });
        let allConstraintsDB2 = await patchingManager.getAllConstraints({ client: client2 });
        let alterScript2 = patchingManager.compareConstraintsAndGenerateAlterScripts({ array1: allConstraintsDB1, array2: allConstraintsDB2 });
        if (alterScript2.length > 0) statments.push(alterScript2);

        let allIndexesDB1 = await patchingManager.getAllIndexes({ client: client1 });
        let allIndexesDB2 = await patchingManager.getAllIndexes({ client: client2 });
        let alterScript3 = patchingManager.compareIndexesAndGenerateAlterScripts({ array1: allIndexesDB1, array2: allIndexesDB2 });
        if (alterScript3.length > 0) statments.push(alterScript3);

        if (statments.length > 0) {
          const fileName = `./${tableName}_alter_script.sql`;
          fs.writeFileSync(path.join(exportDir, fileName), statments.join("\n\n"));

          console.log("Alter script file name", fileName, "📄");
          console.log("Alter script generation completed for", tableName, "✅");
        } else {
          console.log("Tables already up to date ✅, hence no alteration needed.");
        }
      } catch (error) {
        console.log(error);
        console.log("Error in processing data for", tableName, "❌");
      } finally {
        console.log("----------------------------------------------------------");
      }
    }

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
