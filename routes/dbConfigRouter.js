import express from "express";
import { credsExist, getAllCreds, getCreds, saveCreds, updateCreds, deleteCreds } from "../utils/configManager.js";
import { validateDatabaseCredentials } from "../utils/dbValidator.js";
const router = express.Router();

router.post("/add-database", async (req, res) => {
  try {
    const { name, host, type, database, user, password, port, ssl, description, created_at, updated_at } = req.body;
    console.log("body:", name, type, host, database, user, password, port, ssl, description, created_at, updated_at);

    if (await credsExist(name)) {
      return res.status(409).send({
        status: "Error",
        message: `Database credentials with ${name} name already exists`,
        result: {},
      });
    }

    await saveCreds({
      name,
      host,
      type,
      database,
      user,
      password,
      port,
      ssl,
      description,
      created_at,
      updated_at,
    });
    const config = await getCreds(name);
    console.log("config:", config);
    return res.status(201).send({
      status: "Success",
      message: "Successfully added database",
      result: config,
    });
  } catch (error) {
    console.log("error:", error);
    return res.status(500).send({
      status: "Error",
      message: error.message,
      result: {},
    });
  }
});

router.post("/test-connection", async (req, res) => {
  try {
    const { host, database, user, password, port, ssl } = req.body;
    console.log("body:", host, database, user, password, port, ssl);

    const validateDb = await validateDatabaseCredentials({ host, database, user, password, port, ssl });

    if (validateDb.success) {
      return res.status(200).send({
        status: "Success",
        message: validateDb.message,
        result: {},
      });
    } else {
      return res.status(200).send({
        status: "Error",
        message: validateDb.message,
        result: {},
      });
    }
  } catch (error) {
    console.log("error:", error);
    return res.status(500).send({
      status: "Error",
      message: error.message,
      result: {},
    });
  }
});

router.get("/database-list", async (req, res) => {
  try {
    const creds = await getAllCreds();

    return res.status(200).send({
      status: "Success",
      message: "List of all database creds",
      result: creds,
    });
  } catch (error) {
    console.log("error:", error);
    return res.status(500).send({
      status: "Error",
      message: error.message,
      result: {},
    });
  }
});

router.put("/update-database/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const { host, type, database, user, password, port, ssl, description, updated_at } = req.body;
    console.log("Updating database:", name);

    if (!(await credsExist(name))) {
      return res.status(404).send({
        status: "Error",
        message: `Database credentials with ${name} name not found`,
        result: {},
      });
    }

    await updateCreds(name, {
      host,
      type,
      database,
      user,
      password,
      port,
      ssl,
      description,
      updated_at,
    });
    const updatedConfig = await getCreds(name);
    return res.status(200).send({
      status: "Success",
      message: "Successfully updated database",
      result: updatedConfig,
    });
  } catch (error) {
    console.log("error:", error);
    return res.status(500).send({
      status: "Error",
      message: error.message,
      result: {},
    });
  }
});

router.delete("/delete-database/:name", async (req, res) => {
  try {
    const { name } = req.params;
    console.log("Deleting database:", name);

    if (!(await credsExist(name))) {
      return res.status(404).send({
        status: "Error",
        message: `Database credentials with ${name} name not found`,
        result: {},
      });
    }

    await deleteCreds(name);
    return res.status(200).send({
      status: "Success",
      message: "Successfully deleted database",
      result: {},
    });
  } catch (error) {
    console.log("error:", error);
    return res.status(500).send({
      status: "Error",
      message: error.message,
      result: {},
    });
  }
});

router.get("/database-schemas/:name", async (req, res) => {
  try {
    const { name } = req.params;
    console.log("Fetching schemas for database:", name);

    if (!(await credsExist(name))) {
      return res.status(404).send({
        status: "Error",
        message: `Database credentials with ${name} name not found`,
        result: {},
      });
    }

    const creds = await getCreds(name);
    const DB = (await import("../utils/DB.js")).default;
    const db = new DB(creds);

    // Connect to the database
    await db.client.connect();

    const sql = "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast') AND schema_name NOT LIKE 'pg_temp_%' AND schema_name NOT LIKE 'pg_toast_temp_%' ORDER BY schema_name;";
    const result = await db.executeQuery(sql);

    // Close the connection
    await db.client.end();

    return res.status(200).send({
      status: "Success",
      message: "List of schemas for database",
      result: result.rows.map(row => row.schema_name),
    });
  } catch (error) {
    console.log("error:", error);
    return res.status(500).send({
      status: "Error",
      message: error.message,
      result: {},
    });
  }
});

router.get("/database-tables/:name/:schema", async (req, res) => {
  try {
    const { name, schema } = req.params;
    console.log("Fetching tables for database:", name, "schema:", schema);

    if (!(await credsExist(name))) {
      return res.status(404).send({
        status: "Error",
        message: `Database credentials with ${name} name not found`,
        result: {},
      });
    }

    const creds = await getCreds(name);
    const DB = (await import("../utils/DB.js")).default;
    const db = new DB(creds);

    // Connect to the database
    await db.client.connect();

    const sql = `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_type = 'BASE TABLE' ORDER BY table_name;`;
    const result = await db.executeQuery(sql, [schema]);

    // Close the connection
    await db.client.end();

    return res.status(200).send({
      status: "Success",
      message: "List of tables for database and schema",
      result: result.rows.map(row => row.table_name),
    });
  } catch (error) {
    console.log("error:", error);
    return res.status(500).send({
      status: "Error",
      message: error.message,
      result: {},
    });
  }
});

export default router;
