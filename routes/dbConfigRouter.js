import express from "express";
import { credsExist, getAllCreds, getCreds, saveCreds, deleteCreds } from "../utils/configManager.js";
import { validateDatabaseCredentials } from "../utils/dbValidator.js";
const router = express.Router();

router.post("/add-database", async (req, res) => {
  try {
    const currentDateTimeISO = new Date().toISOString();
    const creationDate = currentDateTimeISO;
    const lastUpdateDate = null;

    const { name, host, type, database, user, password, port, ssl, description } = req.body;
    console.log("body:", name, type, host, database, user, password, port, ssl, description);

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
      creationDate,
      lastUpdateDate,
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
export default router;
