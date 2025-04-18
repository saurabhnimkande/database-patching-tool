import fs from "fs";
import PatchingManager from "../../utils/PatchingManager.js";
import path from "path";

export default async function patchAllViews({ tableSchema, sourceFilePath, creds1, creds2, exportDir }) {
  let client1 = {}; // qa client
  let client2 = {}; // demo client

  try {
    const patchingManager = new PatchingManager({ tableSchema });
    await patchingManager.setUpDB({ creds1, creds2 });
    client1 = patchingManager.getClient1();
    client2 = patchingManager.getClient2();

    const viewsDB1 = await patchingManager.getAllViews({ client: client1 });
    const viewsDB2 = await patchingManager.getAllViews({ client: client2 });
    let viewsDiff = patchingManager.getDifferenceByKey({ array1: viewsDB1, array2: viewsDB2, key: "view_name" });
    let fileContents = fs.readFileSync(sourceFilePath, "utf8");
    let { tenantViews, views, unorderedViews } = patchingManager.generateCreateViewsScript({ array1: viewsDB1, fileContents, viewsDiff });

    if (tenantViews) {
      fs.writeFileSync(path.join(exportDir, "./fntl_tenant_views.sql"), tenantViews);
      console.log("Tenant views script file generated", "📄");
    }
    if (views) {
      fs.writeFileSync(path.join(exportDir, "./fntl_views.sql"), views);
      console.log("Views script file generated", "📄");
    }
    if (unorderedViews) {
      fs.writeFileSync(path.join(exportDir, "./fntl_unordered_views.sql"), unorderedViews);
      console.log("Unordered views script file generated", "📄");
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
