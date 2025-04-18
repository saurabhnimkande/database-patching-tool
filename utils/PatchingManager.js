import DB from "./db.js";

export default class PatchingManager {
  constructor({ tableSchema }) {
    this.client1 = {};
    this.client2 = {};
    this.tableMetadata = {};
    this.seedingConfigMetadata = {};
    this.tableName = "";
    this.constraintData = { unique: [], primary: [] };
    this.tableSchema = tableSchema;
    // eslint-disable-next-line no-undef
    this.startTime = process.hrtime();
  }

  /**
   * Initializes and sets up database clients for two database instances (`client1` and `client2`),
   * and starts a transaction for each client.
   *
   * @param {Object} options - Configuration options for setting up database clients.
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
  async setUpDB({ creds1, creds2 }) {
    this.client1 = new DB({
      user: creds1.user,
      host: creds1.host,
      database: creds1.database,
      password: creds1.password,
      port: creds1.port,
      ssl: creds1.ssl ?? true,
    });

    await this.client1.startTransaction();

    if (creds2 !== undefined) {
      this.client2 = new DB({
        user: creds2.user,
        host: creds2.host,
        database: creds2.database,
        password: creds2.password,
        port: creds2.port,
        ssl: creds2.ssl ?? true,
      });

      await this.client2.startTransaction();
    }
  }

  /**
   * Sets the name of the table to be used in SQL operations.
   *
   * This function assigns the provided `tableName` to the instance variable `this.tableName`,
   * which is later used to generate SQL statements dynamically.
   *
   * @param {Object} param - An object containing the table name.
   * @param {string} param.tableName - The name of the table to be set.
   *
   * @returns {void}
   */
  setUpTableName({ tableName }) {
    this.tableName = tableName;
    this.constraintData = { unique: [], primary: [] };
  }

  /**
   * Sets up metadata for the specified table by fetching relevant metadata from `tablesMetadata`.
   *
   * @param {Object} options - Configuration options for setting up table metadata.
   * @param {string} options.tableName - The name of the table whose metadata needs to be set.
   *
   * @throws {Error} Throws an error if no metadata is found for the specified table.
   */
  setUpMetadata({ tableName, tablesMetadata, seedingConfigMetadata }) {
    this.tableName = tableName;
    this.seedingConfigMetadata = seedingConfigMetadata;
    let tableMetadataFiltered = tablesMetadata.filter((el) => el.tableName === tableName);
    if (!tableMetadataFiltered || tableMetadataFiltered.length === 0) {
      throw new Error("No metadata present");
    }
    this.tableMetadata = tableMetadataFiltered && tableMetadataFiltered[0] ? tableMetadataFiltered[0] : {};
  }

  /**
   * Retrieves the database client for the source database (`client1`).
   *
   * @returns {Object} The database client instance for `client1`.
   */
  getClient1() {
    return this.client1;
  }

  /**
   * Retrieves the database client for the source database (`client2`).
   *
   * @returns {Object} The database client instance for `client2`.
   */
  getClient2() {
    return this.client2;
  }

  /**
   * Retrieves all columns and their metadata from the specified table.
   *
   * @param {Object} options - Configuration options for retrieving column metadata.
   * @param {Object} options.client - The database client used to execute the query.
   *
   * @returns {Promise<Array<Object>>} A promise that resolves to an array of objects representing the columns.
   */
  async getAllColumns({ client }) {
    if (!client.executeQuery) return [];
    let sql = `SELECT column_name, data_type, udt_name, character_maximum_length, numeric_precision, numeric_scale, is_nullable, column_default, pg_get_serial_sequence($1, column_name) AS serial_sequence
    FROM information_schema.columns
    WHERE table_name = $1 AND table_schema = '${this.tableSchema}'
    ORDER BY ordinal_position;`;

    let response = await client.executeQuery(sql, [this.tableName]);
    return response && response.rows ? response.rows : [];
  }

  /**
   * Retrieves all constraints for the specified table in the PostgreSQL database.
   *
   * This asynchronous function queries the `pg_constraint` system catalog to fetch
   * information about all constraints applied to the given table, such as:
   * - Primary keys (`p`)
   * - Foreign keys (`f`)
   * - Unique constraints (`u`)
   * - Check constraints (`c`)
   * - Exclusion constraints (`x`)
   *
   * @param {Object} param - An object containing the database client.
   * @param {Object} param.client - The database client used to execute the query.
   *
   * @returns {Promise<Array<Object>>} A promise that resolves to an array of constraint objects, where each object contains:
   * - constraint_name {string} - Name of the constraint.
   * - constraint_type {string} - Type of the constraint (`p`, `f`, `u`, `c`, `x`).
   * - constraint_definition {string} - Definition of the constraint.
   */
  async getAllConstraints({ client }) {
    if (!client.executeQuery) return [];
    let sql = `SELECT conname as constraint_name, contype as constraint_type, pg_get_constraintdef(c.oid) as constraint_definition
    FROM pg_constraint c
    JOIN pg_class t on c.conrelid = t.oid
    JOIN pg_namespace n on n.oid = t.relnamespace
    WHERE t.relname = $1
	  AND n.nspname = '${this.tableSchema}';`;

    let response = await client.executeQuery(sql, [this.tableName]);
    return response && response.rows ? response.rows : [];
  }

  /**
   * Retrieves all indexes for the specified table in the PostgreSQL database.
   *
   * This asynchronous function queries the `pg_indexes` system catalog to fetch
   * information about all indexes associated with the given table, including:
   * - Unique indexes
   * - Partial indexes
   * - Composite indexes
   *
   * @param {Object} param - An object containing the database client.
   * @param {Object} param.client - The database client used to execute the query.
   *
   * @returns {Promise<Array<Object>>} A promise that resolves to an array of index objects, where each object contains:
   * - index_name {string} - Name of the index.
   * - index_definition {string} - SQL definition used to create the index.
   */
  async getAllIndexes({ client }) {
    if (!client.executeQuery) return [];
    let sql = `SELECT indexname AS index_name, indexdef AS index_definition
    FROM pg_indexes
    WHERE tablename = $1
    AND schemaname = '${this.tableSchema}';`;

    let response = await client.executeQuery(sql, [this.tableName]);
    return response && response.rows ? response.rows : [];
  }

  /**
   * Retrieves all table names from the PostgreSQL database schema.
   *
   * This function queries the `information_schema.tables` to get a list of all tables
   * within the `public` schema and returns them in alphabetical order.
   *
   * @async
   * @param {Object} params - The parameters object.
   * @param {Object} params.client - The database client used to execute the query.
   *
   * @returns {Promise<Array<Object>>} A promise that resolves to an array of objects, where each object contains:
   * - `table_schema` (string): The schema name (typically `public`).
   * - `table_name` (string): The name of the table.
   */
  async getAllTables({ client }) {
    if (!client.executeQuery) return [];

    // this is done temporarily will be fixed later hardcoded sql and tables
    let ignoredTables = [
      "key_vault",
      "mtd_invoice_amt",
      "wf_setup_config",
      "fntl_test",
      "fntl_project_snapshot_bak",
      "fntl_project_snapshot_test",
      "fntl_sup_req_details",
      "fntl_planning_resource_exportcsv",
      "fntl_org_configurations_new",
      "fntl_opportunities_test",
      "fntl_opportunities_new_bkp",
      "fntl_opportunities_new",
      "fntl_json_objects_backup",
      "himanshu_temptable",
      "hk_fntl_project_snapshot",
      "test",
      "test_sql",
      "zz_fntl_oic_dlq_runs",
      "fntl_plan_lines_2",
      "fntl_plan_lines_tmp_13082024",
      "fntl_organizations_23_jul_bkup",
      "fntl_periods_march5",
      "hk_tmp_load_data",
      "fntl_cost_lines1",
    ];
    let sql = `SELECT schemaname, tablename
    FROM pg_catalog.pg_tables
    WHERE schemaname = '${
      this.tableSchema
    }' and tablename not like 'tmp_%' and tablename not like 'demo_%' and tablename not like 'temp_%' and tablename not like 'tenant_1%' and tablename not like '%_bkp_%' and tablename not like '%_60' and tablename not in (${ignoredTables
      .map((el) => `'${el}'`)
      .join(",")})
    ORDER BY schemaname, tablename;`;

    let response = await client.executeQuery(sql);
    return response && response.rows ? response.rows : [];
  }

  /**
   * Retrieves all rows from the specified table.
   *
   * @param {Object} options - Configuration options for retrieving data.
   * @param {Object} options.client - The database client used to execute the query.
   *
   * @returns {Promise<Array<Object>>} A promise that resolves to an array of rows from the table.
   */
  async getAllRows({ client }) {
    if (!client.executeQuery) return [];
    let sql = `select * from ${this.tableName}`;
    if (this?.tableMetadata?.orderBy) sql += ` ORDER BY ${this?.tableMetadata?.orderBy}`;
    let response = await client.executeQuery(sql, []);
    if (!response?.rows) return [];
    const rows = response.rows.map((row) => {
      const newRow = {};
      for (const [key, value] of Object.entries(row)) {
        newRow[key] = typeof value === "object" && value !== null ? JSON.stringify(value) : value;
      }
      return newRow;
    });

    return rows;
  }

  /**
   * Retrieves sequence details from the `pg_sequences` system catalog.
   *
   * @param {object} params - The input parameters.
   * @param {object} params.client - The database client used to execute the query.
   * @param {string} params.sequenceName - The name of the sequence to retrieve details for.
   *
   * @returns {Promise<object[]>} - A promise that resolves to an array of sequence details.
   *                               If no matching sequence is found, returns an empty array.
   */
  async getSequenceDetails({ client, sequenceName }) {
    if (!client.executeQuery) return [];
    let sql = `SELECT *
    FROM pg_sequences
    WHERE schemaname = '${this.tableSchema}' AND sequencename = $1;`;

    let response = await client.executeQuery(sql, [sequenceName]);
    return response && response.rows ? response.rows : [];
  }

  /**
   * Retrieves all views and their definitions from the specified schema.
   *
   * @param {Object} params - The input parameters.
   * @param {Object} params.client - The database client to execute the query.
   * @returns {Promise<Array<Object>>} - A promise that resolves to an array of objects containing view names and their definitions.
   */
  async getAllViews({ client }) {
    if (!client.executeQuery) return [];
    let sql = `SELECT table_name AS view_name, pg_get_viewdef(table_name::regclass, true) AS view_definition
    FROM information_schema.views
    WHERE table_schema = $1;`;

    let response = await client.executeQuery(sql, [this.tableSchema]);
    return response && response.rows ? response.rows : [];
  }

  /**
   * Removes columns from the data array that have names matching specified ignored prefixes.
   *
   * @param {Object} options - Configuration options for filtering columns.
   * @param {Array<Object>} options.data - An array of objects representing the column metadata.
   * @param {string} options.data[].column_name - The name of the column to be checked.
   *
   * @returns {Array<Object>} A filtered array of column objects with ignored columns removed.
   */
  removeInsertColumn({ data }) {
    const filteredData = data.filter((el) => !this.tableMetadata.ignoredColumns.some((prefix) => el.column_name.startsWith(prefix)));
    return filteredData;
  }

  /**
   * Removes columns from the data object that match specified ignored prefixes.
   *
   * @param {Object} options - Configuration options for filtering data.
   * @param {Array<Object>} options.data - An array of objects representing the data to be filtered.
   *
   * @returns {Array<Object>} A new array of objects with the ignored columns removed.
   */
  removeColumnsFromResponse({ data }) {
    let newData = [];
    for (let row of data) {
      const filteredData = Object.keys(row)
        .filter((key) => !this.tableMetadata.ignoredColumns.some((prefix) => key.startsWith(prefix)))
        .reduce((obj, key) => {
          obj[key] = row[key];
          return obj;
        }, {});
      newData.push(filteredData);
    }
    return newData;
  }

  /**
   * Compares two arrays of objects and returns the differences.
   *
   * @param {Object} options - Configuration options for finding differences.
   * @param {Array<Object>} options.array1 - The first array of objects to compare.
   * @param {Array<Object>} options.array2 - The second array of objects to compare.
   *
   * @returns {Array<Object>} An array of objects that are present in `array1` but not in `array2`.
   */
  getDifference({ array1, array2 }) {
    let compareColumns = this.tableMetadata.compareColumns;
    let mapData = {};
    let diff = [];
    for (let row of array2) {
      let str = "";
      for (let col of compareColumns) {
        str += `${row[col]}-`;
      }
      mapData[str] = row;
    }

    for (let row of array1) {
      let str = "";
      for (let col of compareColumns) {
        str += `${row[col]}-`;
      }
      if (mapData[str] === undefined) {
        diff.push(row);
      }
    }
    return diff;
  }

  /**
   * Compares two arrays of table objects and returns the names of tables
   * that are present in `array1` but missing in `array2`.
   *
   * @param {Object} params - The function parameters.
   * @param {Array<Object>} params.array1 - The first array of table objects to compare.
   * @param {Array<Object>} params.array2 - The second array of table objects to compare.
   * @returns {Array<string>} - An array of table names that are in `array1` but not in `array2`.
   */
  getDifferenceByKey({ array1, array2, key }) {
    const dataMap2 = array2.reduce((map, table) => {
      map[table[key]] = table;
      return map;
    }, {});
    let result = [];

    for (let row of array1) {
      if (dataMap2[row[key]] === undefined) {
        result.push(row[key]);
      }
    }
    return result;
  }

  /**
   * Maps and generates SQL values for an INSERT statement based on provided data and columns.
   *
   * @param {Object} options - Configuration options for generating the SQL values.
   * @param {Array} options.data - An array of objects representing the data to be inserted.
   * @param {Array} options.columns - An array of objects representing the column details.
   * @param {string} options.columns[].column_name - The name of the column to be included in the INSERT values.
   *
   * @returns {Array<string>} An array of formatted SQL value strings ready for insertion.
   */
  async mapInsertScriptValue({ data, columns }) {
    let response = [];
    for (let i = 0; i < data.length; i++) {
      let str = "";
      let dataItem = data[i];
      for (let j = 0; j < columns.length; j++) {
        let column = columns[j];
        let value = dataItem[column.column_name];
        if (typeof value === "string") {
          value = this.#escapeStringForSql(value);
          value = `'${value}'`;
        } else if (this.#isObject(value)) {
          value = `'${JSON.stringify(value)}'::json`;
        } else if (this.#isDate(value)) {
          let dateObject = new Date(value);
          let dateValue = dateObject.toISOString();
          let dateStr = dateValue.split("T")[0];
          value = `'${dateStr}'`;
        }

        let relColumns =
          this.tableMetadata?.referenceColumns && this.tableMetadata?.referenceColumns?.length > 0
            ? this.tableMetadata?.referenceColumns?.filter((el) => el?.column === column?.column_name)
            : [];
        if (relColumns.length > 0) {
          let referenceData = relColumns[0];
          let fetchSQL = `SELECT ${referenceData.compareColumns.join(",")} FROM ${referenceData.table} WHERE ${
            referenceData.sourceColumn ? referenceData.sourceColumn : referenceData.column
          } = ${value}`;
          let clientRes = await this.client1.executeQuery(fetchSQL, []);
          clientRes = clientRes && clientRes?.rows ? clientRes?.rows?.[0] : {};
          let dynamicStr = [];
          for (let keys in clientRes) {
            if (typeof clientRes[keys] === "number") {
              dynamicStr.push(`${keys} = ${clientRes[keys]}`);
            } else if (clientRes[keys] === null) {
              dynamicStr.push(`${keys} IS NULL`);
            } else {
              dynamicStr.push(`${keys} = '${clientRes[keys]}'`);
            }
          }
          let sqlStr = `(SELECT ${referenceData.sourceColumn ? referenceData.sourceColumn : referenceData.column} FROM ${
            referenceData.table
          } WHERE ${dynamicStr.join(" AND ")} LIMIT 1)`;
          if (dynamicStr.length > 0) value = sqlStr;
        }

        if (j === 0) {
          str += `(${column.column_name in this.seedingConfigMetadata ? this.seedingConfigMetadata[column.column_name] : value},`;
        } else if (j === columns.length - 1) {
          str += ` ${column.column_name in this.seedingConfigMetadata ? this.seedingConfigMetadata[column.column_name] : value})`;
        } else {
          str += ` ${column.column_name in this.seedingConfigMetadata ? this.seedingConfigMetadata[column.column_name] : value},`;
        }
      }
      response.push(str);
    }
    return response;
  }

  /**
   * Generates and processes SQL INSERT statements based on the provided data and format.
   *
   * @param {Object} params - The input parameters.
   * @param {Array<string>} params.finalData - An array of values to be inserted into the table.
   * @param {Array<string>} params.columns - An array of column names for the table.
   *
   * @returns {string} A string containing the generated SQL INSERT statements.
   */
  processInsertStatement({ finalData, columns }) {
    let tableMetadata = this.tableMetadata;
    let insertType = tableMetadata?.insertStatementFormat ?? "batch";
    let fileData = "";
    const insertStatement = this.generateInsertStatement({ columns });
    if (insertType === "batch") {
      let joinData = finalData.join(",\n");
      fileData = insertStatement + joinData + ";";
    } else if (insertType === "split") {
      for (let value of finalData) {
        fileData += insertStatement + value + ";" + "\n";
      }
    } else {
      if (!insertType.includes("batch")) throw new Error("Please provide valid insertStatementFormat value.");
      let batchSize = Number(insertType.split("-")[1]);
      let tempSql = "";
      for (let i = 0; i < finalData.length; i++) {
        tempSql += finalData[i] + (i % batchSize === batchSize - 1 || i === finalData.length - 1 ? "" : ",\n");
        if ((i % batchSize === batchSize - 1 && i !== 0) || i === finalData.length - 1) {
          fileData += insertStatement + tempSql + ";" + "\n";
          tempSql = "";
        }
      }
    }
    return fileData;
  }

  /**
   * Generates an SQL INSERT statement for the specified table.
   *
   * @param {Object} options - Configuration options for generating the INSERT statement.
   * @param {Array} options.columns - An array of objects representing the column details.
   * @param {string} options.columns[].column_name - The name of the column to be included in the INSERT statement.
   *
   * @returns {string} An SQL INSERT statement with the specified columns formatted correctly.
   */
  generateInsertStatement({ columns }) {
    let insertStatement = `INSERT INTO ${this.tableName} (`;
    for (let i = 0; i < columns.length; i++) {
      if (i === 0) {
        insertStatement += `${columns[i].column_name},`;
      } else if (i === columns.length - 1) {
        insertStatement += ` ${columns[i].column_name}) VALUES \n`;
      } else {
        insertStatement += ` ${columns[i].column_name},`;
      }
    }
    return insertStatement;
  }

  /**
   * Generates ALTER TABLE statements to synchronize the columns of a PostgreSQL table.
   *
   * This function compares two arrays of column definitions (`array1` and `array2`),
   * identifies differences, and generates SQL statements to:
   * - Add missing columns (`ADD COLUMN`).
   * - Modify existing columns if their definition has changed (`ALTER COLUMN`).
   * - Drop columns that are no longer present (`DROP COLUMN`).
   *
   * @param {Array<Object>} array1 - The reference array containing the current state of the columns.
   * @param {Array<Object>} array2 - The target array containing the desired state of the columns.
   *
   * @returns {string} A string containing the generated SQL statements.
   */
  async compareColumnsAndGenerateAlterScripts({ array1, array2 }) {
    const alterStatements = [];
    const dropStatements = [];
    const modifyStatements = [];
    const combineStatements = [];

    const dataMap1 = array1.reduce((map, col) => {
      map[col.column_name] = col;
      return map;
    }, {});

    const dataMap2 = array2.reduce((map, col) => {
      map[col.column_name] = col;
      return map;
    }, {});

    for (const column1 of array1) {
      const column2 = dataMap2[column1.column_name];

      if (!column2) {
        const addStatement = `ALTER TABLE ${this.tableName} ADD COLUMN IF NOT EXISTS ${column1.column_name} ${this.#getColumnDefinition(column1)};`;
        alterStatements.push(addStatement);
      } else {
        const modifyStatement = await this.#getModifyStatements({ column1, column2 });
        if (modifyStatement) modifyStatements.push(modifyStatement);
      }
    }

    for (const column of array2) {
      if (!dataMap1[column.column_name]) {
        const dropStatement = `ALTER TABLE ${this.tableName} DROP COLUMN IF EXISTS ${column.column_name} CASCADE;`;
        dropStatements.push(dropStatement);
      }
    }

    if (dropStatements.length > 0) combineStatements.push(dropStatements.join("\n"));
    if (alterStatements.length > 0) combineStatements.push(alterStatements.join("\n"));
    if (modifyStatements.length > 0) combineStatements.push(modifyStatements.join("\n"));
    return combineStatements.length > 0 ? combineStatements.join("\n") : [];
  }

  /**
   * Generates ALTER TABLE statements to synchronize the constraints of a PostgreSQL table.
   *
   * This function compares two arrays of constraint definitions (`array1` and `array2`),
   * identifies differences, and generates SQL statements to:
   * - Drop constraints that exist in the target array (`array2`) but are missing or modified in the reference array (`array1`).
   * - Add or modify constraints that are present in the reference array (`array1`) but are missing or different in the target array (`array2`).
   *
   * @param {Object} params - Parameters object.
   * @param {Array<Object>} params.array1 - The reference array containing the current state of the constraints.
   * @param {Array<Object>} params.array2 - The target array containing the desired state of the constraints.
   *
   * @returns {string} A string containing the generated SQL statements to modify constraints.
   */
  compareConstraintsAndGenerateAlterScripts({ array1, array2 }) {
    const alterStatements = [];
    const dropStatements = [];
    const addStatements = [];

    const dataMap1 = array1.reduce((map, constraint) => {
      map[constraint.constraint_name] = constraint;
      return map;
    }, {});

    const dataMap2 = array2.reduce((map, constraint) => {
      map[constraint.constraint_name] = constraint;
      return map;
    }, {});

    for (const constraint of array2) {
      if (
        !dataMap1[constraint.constraint_name] ||
        dataMap1[constraint.constraint_name].constraint_definition !== dataMap2[constraint.constraint_name].constraint_definition // Constraint definition changed
      ) {
        dropStatements.push(`ALTER TABLE ${this.tableName} DROP CONSTRAINT IF EXISTS ${constraint.constraint_name} CASCADE;`);
      }
    }

    for (const constraint of array1) {
      if (
        !dataMap2[constraint.constraint_name] || // Constraint doesn't exist in DB2
        dataMap1[constraint.constraint_name].constraint_definition !== dataMap2[constraint.constraint_name].constraint_definition // Constraint definition changed
      ) {
        if (constraint.constraint_type === "p") {
          this.constraintData.primary.push(constraint.constraint_name);
        }
        if (constraint.constraint_type === "u") {
          this.constraintData.unique.push(constraint.constraint_name);
        }
        addStatements.push(
          `ALTER TABLE ${this.tableName} ADD CONSTRAINT ${constraint.constraint_name} ${dataMap1[constraint.constraint_name].constraint_definition};`
        );
      }
    }

    if (dropStatements.length > 0) alterStatements.push(dropStatements.join("\n"));
    if (addStatements.length > 0) alterStatements.push(addStatements.join("\n"));

    return alterStatements.length > 0 ? alterStatements.join("\n") : [];
  }

  /**
   * Compares indexes between two versions of a table and generates ALTER TABLE statements.
   *
   * This function compares index definitions (`allIndexesDB1` and `allIndexesDB2`)
   * and generates SQL scripts to:
   * - Drop indexes that exist in `DB2` but not in `DB1` or have changed definitions.
   * - Create new indexes found in `DB1` but not in `DB2`.
   * - Modify indexes if the definition has changed (drop and recreate).
   *
   * @param {Array<Object>} allIndexesDB1 - Array of indexes from the target state.
   * @param {Array<Object>} allIndexesDB2 - Array of indexes from the current state.
   *
   * Index object properties:
   * - index_name {string} - Name of the index.
   * - index_definition {string} - SQL definition of the index.
   *
   * @returns {string} A string containing the generated ALTER TABLE statements.
   */
  compareIndexesAndGenerateAlterScripts({ array1, array2 }) {
    const alterStatements = [];
    const dropStatements = [];
    const createStatements = [];

    const dataMap1 = array1.reduce((map, index) => {
      map[index.index_name] = index;
      return map;
    }, {});

    const dataMap2 = array2.reduce((map, index) => {
      map[index.index_name] = index;
      return map;
    }, {});

    for (const index of array2) {
      if (!dataMap1[index.index_name] || dataMap1[index.index_name].index_definition !== dataMap2[index.index_name].index_definition) {
        if (!(this.constraintData.primary.includes(index.index_name) || this.constraintData.unique.includes(index.index_name))) {
          dropStatements.push(`DROP INDEX IF EXISTS ${index.index_name};`);
        }
      }
    }

    for (const index of array1) {
      if (!dataMap2[index.index_name] || dataMap1[index.index_name].index_definition !== dataMap2[index.index_name].index_definition) {
        if (!(this.constraintData.primary.includes(index.index_name) || this.constraintData.unique.includes(index.index_name))) {
          createStatements.push(`${dataMap1[index.index_name].index_definition};`);
        }
      }
    }

    if (dropStatements.length > 0) {
      alterStatements.push(dropStatements.join("\n"));
    }
    if (createStatements.length > 0) {
      alterStatements.push(createStatements.join("\n"));
    }

    return alterStatements.length > 0 ? alterStatements.join("\n") : [];
  }

  /**
   * Generates a CREATE TABLE script along with constraints and indexes
   * based on the provided column definitions, constraints, and indexes.
   *
   * @param {Object} params - The function parameters.
   * @param {Array<Object>} params.columns - Array of column objects containing column metadata.
   * @param {Array<Object>} params.indexes - Array of index objects containing index metadata.
   * @param {Array<Object>} params.constraints - Array of constraint objects containing constraint definitions.
   * @returns {string} - A complete CREATE TABLE script with indexes and constraints.
   */
  generateCreateTableScript({ columns, indexes, constraints }) {
    let stdStr = `CREATE TABLE IF NOT EXISTS ${this.tableName} (\n`;
    let tableData = [];
    let indexData = [];

    for (let column of columns) {
      tableData.push(`  ${column.column_name} ${this.#getColumnDefinition(column)}`);
    }

    for (let constraint of constraints) {
      if (constraint.constraint_type === "p") {
        this.constraintData.primary.push(constraint.constraint_name);
      }
      if (constraint.constraint_type === "u") {
        this.constraintData.unique.push(constraint.constraint_name);
      }
      tableData.push(`  CONSTRAINT ${constraint.constraint_name} ${constraint.constraint_definition}`);
    }

    for (let index of indexes) {
      if (!(this.constraintData.primary.includes(index.index_name) || this.constraintData.unique.includes(index.index_name))) {
        indexData.push(`${this.#resolveIndexDefinition(index.index_definition)};`);
      }
    }
    stdStr += tableData.join(",\n") + "\n);";
    if (indexData.length > 0) {
      stdStr += "\n" + indexData.join("\n");
    }

    return stdStr;
  }

  /**
   * Generates SQL scripts to create or replace views based on the provided differences.
   *
   * @param {Object} params - The input parameters.
   * @param {Array<Object>} params.array1 - Array of view definitions with `view_name` and `view_definition`.
   * @param {Array<string>} params.viewsDiff - List of views that differ between the environments.
   * @param {string} params.fileContents - Contents of a file with the order of views for reference.
   * @returns {Object} - An object containing SQL scripts for tenant views, regular views, and unordered views.
   */
  generateCreateViewsScript({ array1, viewsDiff, fileContents }) {
    let tenantViewsOrder = [];
    let viewsOrder = [];

    let tenantViewsRes = [];
    let viewsRes = [];
    let unorderedViews = [];

    const dataMap1 = array1.reduce((map, view) => {
      map[view.view_name] = view;
      return map;
    }, {});

    if (fileContents) {
      fileContents = fileContents.split("\n").map((el) => el.trim());
      for (let view of fileContents) {
        let viewName = this.#extractViewName(view);
        if (viewName !== null) {
          if (viewName.endsWith("_tv")) {
            tenantViewsOrder.push(viewName);
          } else {
            viewsOrder.push(viewName);
          }
        }
      }
      tenantViewsOrder.reverse();
      viewsOrder.reverse();
    }

    for (let view of viewsDiff) {
      if (view.endsWith("_tv")) {
        if (tenantViewsOrder.indexOf(view) !== -1) {
          tenantViewsRes[tenantViewsOrder.indexOf(view)] = dataMap1[view];
        } else {
          unorderedViews.push(dataMap1[view]);
        }
      } else {
        if (viewsOrder.indexOf(view) !== -1) {
          viewsRes[viewsOrder.indexOf(view)] = dataMap1[view];
        } else {
          unorderedViews.push(dataMap1[view]);
        }
      }
    }
    viewsRes = viewsRes.filter((el) => el);
    tenantViewsRes = tenantViewsRes.filter((el) => el);

    return {
      tenantViews:
        tenantViewsRes.length > 0
          ? tenantViewsRes
              .map((el) => `CREATE OR REPLACE VIEW ${el.view_name} \n AS ${this.#generateTenantViewStatement(el.view_name)}`)
              .join("\n\n--------------------------------------------------------------------------------\n\n")
          : "",
      views:
        viewsRes.length > 0
          ? viewsRes
              .map((el) => `CREATE OR REPLACE VIEW ${el.view_name} \n AS${el.view_definition}`)
              .join("\n\n--------------------------------------------------------------------------------\n\n")
          : "",
      unorderedViews:
        unorderedViews.length > 0
          ? unorderedViews
              .map((el) => `CREATE OR REPLACE VIEW ${el.view_name} \n AS${el.view_definition}`)
              .join("\n\n--------------------------------------------------------------------------------\n\n")
          : "",
    };
  }

  /**
   * Reorders columns based on primary constraints, attribute columns, tenant columns, and "who" columns.
   *
   * The function rearranges database table columns into a specific order:
   * 1. Primary key columns (from constraints).
   * 2. General columns (excluding tenant and "who" columns).
   * 3. Attribute columns, sorted by type (`c_attr`, `n_attr`, `d_attr`) and index.
   * 4. Tenant columns (`tenant_id`, `object_version_number`) in a fixed order.
   * 5. "Who" columns (`user_id`, `creation_date`, etc.) in a fixed order.
   *
   * @param {Object} params - The input parameters.
   * @param {Array} params.columns - The list of column objects, each containing `column_name`.
   * @param {Array} params.constraints - The list of constraints, including `constraint_type` and `constraint_definition`.
   * @returns {Array} - The reordered list of columns.
   */
  reArrangeColumnsInOrder({ columns, constraints }) {
    let oldColumns = [...columns];
    let primaryConstraintArray = constraints.filter((el) => el.constraint_type === "p");
    let primaryConstraint = primaryConstraintArray.length > 0 ? primaryConstraintArray[0].constraint_definition : "";
    let tenantColumns = ["tenant_id", "object_version_number"];
    let whoColumns = ["user_id", "creation_date", "created_by", "last_updated_by", "last_update_date", "last_login_id"];
    let primaryColumnsRes = [];
    let attrColumnsRes = [];
    let tenantColumnsRes = [];
    let whoColumnsRes = [];

    oldColumns = oldColumns.filter((column) => {
      if (primaryConstraint.includes(column.column_name)) {
        primaryColumnsRes.push(column);
        return false;
      } else {
        return true;
      }
    });

    const dataMap1 = oldColumns.reduce((map, column) => {
      map[column.column_name] = column;
      return map;
    }, {});

    for (let column of oldColumns) {
      if (!column.column_name.includes("_attr_") && !tenantColumns.includes(column.column_name) && !whoColumns.includes(column.column_name)) {
        primaryColumnsRes.push(column);
      }
      if (column.column_name.includes("_attr_")) {
        attrColumnsRes.push(column);
      }
    }

    for (let order of tenantColumns) {
      if (dataMap1[order]) {
        tenantColumnsRes[tenantColumns.indexOf(order)] = dataMap1[order];
      }
    }

    for (let order of whoColumns) {
      if (dataMap1[order]) {
        whoColumnsRes[whoColumns.indexOf(order)] = dataMap1[order];
      }
    }

    attrColumnsRes.sort((a, b) => {
      const getPrefixAndNumber = (attr) => {
        const match = attr.match(/(c_attr|n_attr|d_attr)_(\d+)/);
        return match ? [match[1], parseInt(match[2], 10)] : [attr, 0];
      };

      const [prefixA, numA] = getPrefixAndNumber(a.column_name);
      const [prefixB, numB] = getPrefixAndNumber(b.column_name);

      const order = { c_attr: 1, n_attr: 2, d_attr: 3 };
      return order[prefixA] - order[prefixB] || numA - numB;
    });

    tenantColumnsRes = tenantColumnsRes.filter((el) => el);
    whoColumnsRes = whoColumnsRes.filter((el) => el);
    let result = [...primaryColumnsRes, ...attrColumnsRes, ...tenantColumnsRes, ...whoColumnsRes];
    return result;
  }

  /**
   * Extracts the names of tables referenced as foreign keys from a list of constraints.
   *
   * @param {Object} params - The input parameters.
   * @param {Array} params.constraints - An array of constraint objects.
   * @returns {Array<string>} - A list of table names referenced as foreign keys.
   */
  extractForeignKeyTables({ constraints }) {
    let res = [];
    for (let constraint of constraints) {
      if (constraint.constraint_type === "f") {
        const match = constraint.constraint_definition.match(/REFERENCES\s+(\w+)/);
        if (match && match[1]) {
          res.push(match[1]);
        }
      }
    }
    return res;
  }

  /**
   * Generates a SQL create table statement in the correct order based on dependencies.
   *
   * @param {Object} params - The input parameters.
   * @param {Object} params.tablesMap - A mapping of table names to their definitions.
   * @returns {string} - A concatenated SQL create table statement.
   */
  processCreateTableOutput({ tablesMap }) {
    let order = this.#orderTables(tablesMap);
    let statement = "";
    for (let table of order) {
      if (tablesMap[table]) {
        statement += tablesMap[table].definition;
      }
    }
    return statement;
  }

  /**
   * Orders tables based on their dependencies using topological sorting.
   *
   * @param {Object} tables - A mapping of table names to their metadata,
   *                          where each table has a `ref` property listing referenced tables.
   * @returns {Array<string>} - A list of table names sorted in dependency order.
   *
   * @description
   * This function builds a dependency graph from the input `tables`, where each table
   * is a node, and edges represent foreign key references. It then performs a
   * topological sort using Kahn’s algorithm (BFS) to determine the correct order
   * for table creation, ensuring referenced tables are created before dependents.
   */
  #orderTables(tables) {
    const graph = new Map();
    const inDegree = new Map();

    for (const table in tables) {
      if (!graph.has(table)) graph.set(table, []);
      if (!inDegree.has(table)) inDegree.set(table, 0);

      for (const refTable of tables[table].ref) {
        if (!graph.has(refTable)) graph.set(refTable, []);
        if (!inDegree.has(refTable)) inDegree.set(refTable, 0);

        graph.get(refTable).push(table);

        inDegree.set(table, (inDegree.get(table) || 0) + 1);
      }
    }

    const queue = [];
    for (const [table, degree] of inDegree.entries()) {
      if (degree === 0) queue.push(table);
    }

    const sortedOrder = [];
    while (queue.length) {
      const table = queue.shift();
      sortedOrder.push(table);

      for (const dependent of graph.get(table)) {
        inDegree.set(dependent, inDegree.get(dependent) - 1);
        if (inDegree.get(dependent) === 0) queue.push(dependent);
      }
    }

    for (const table of graph.keys()) {
      if (!sortedOrder.includes(table)) sortedOrder.push(table);
    }

    return sortedOrder;
  }

  /**
   * Modifies an SQL index definition to ensure it includes "IF NOT EXISTS"
   * and removes the "public." schema reference.
   *
   * @param {string} idxDef - The original SQL index definition.
   * @returns {string} - The modified SQL index definition with "IF NOT EXISTS"
   * added and "public." removed.
   */
  #resolveIndexDefinition(idxDef) {
    let newStr = idxDef;
    newStr = newStr.replaceAll("public.", "");
    newStr = newStr.replace("CREATE UNIQUE INDEX", "CREATE UNIQUE INDEX IF NOT EXISTS");
    newStr = newStr.replace("CREATE INDEX", "CREATE INDEX IF NOT EXISTS");
    return newStr;
  }

  /**
   * Generates the column definition for a PostgreSQL column based on its properties.
   *
   * This function constructs the appropriate SQL definition for a given column by considering:
   * - Data type and length for character types.
   * - Handling of `serial4` and `serial8` for auto-incrementing integer types.
   * - NULL constraints (`NOT NULL`).
   * - Default values (`DEFAULT`).
   *
   * @param {Object} col - The column object containing its properties.
   *
   * @returns {string} A string representing the column definition in SQL format.
   */
  #getColumnDefinition(col) {
    let definition = `${col.udt_name}`;
    let serialSeq = col.serial_sequence ?? col.column_default;
    if ((col.udt_name === "int4" || col.udt_name === "int8") && serialSeq && serialSeq.includes("_seq")) {
      definition = `${col.udt_name === "int4" ? "serial4" : "serial8"}`;
    }

    if (col.character_maximum_length) {
      definition += `(${col.character_maximum_length})`;
    }

    if (col.is_nullable === "NO") {
      definition += " NOT NULL";
    }

    if (col.column_default !== null && !col.column_default.includes("_seq") && col.serial_sequence === null) {
      definition += ` DEFAULT ${col.column_default}`;
    }

    return definition;
  }

  /**
   * Generates ALTER TABLE statements to modify an existing column in a PostgreSQL table.
   *
   * This function compares two column definitions (`column1` and `column2`) and generates SQL statements to:
   * - Modify the column type if the data type or character length has changed (`ALTER COLUMN TYPE`).
   * - Add or remove a `NOT NULL` constraint if the nullability has changed (`SET NOT NULL` or `DROP NOT NULL`).
   * - Set or drop the default value if it has changed (`SET DEFAULT` or `DROP DEFAULT`).
   *
   * @param {Object} column1 - The target column definition with desired properties.
   * @param {Object} column2 - The current column definition to compare against.
   *
   * @returns {string|null} A string containing the generated ALTER TABLE statements, or `null` if no changes are detected.
   */
  async #getModifyStatements({ column1, column2 }) {
    const statements = [];

    // Check if datatype or char length changed
    if (column1.data_type !== column2.data_type || column1.character_maximum_length !== column2.character_maximum_length) {
      let modifyType = `ALTER TABLE ${this.tableName} ALTER COLUMN ${column1.column_name} TYPE ${column1.udt_name}`;

      if (column1.character_maximum_length) {
        modifyType += `(${column1.character_maximum_length})`;
      }

      statements.push(modifyType + ";");
    }

    // Check if NULL constraint changed
    if (column1.is_nullable !== column2.is_nullable) {
      if (column1.is_nullable === "NO") {
        statements.push(`ALTER TABLE ${this.tableName} ALTER COLUMN ${column1.column_name} SET NOT NULL;`);
      } else {
        statements.push(`ALTER TABLE ${this.tableName} ALTER COLUMN ${column1.column_name} DROP NOT NULL;`);
      }
    }

    if (column1.column_default !== null && column1.column_default.includes("_seq")) {
      let sequenceName = this.#extractSequenceName(column1.column_default);
      if (sequenceName) {
        let seqDetails1 = await this.getSequenceDetails({ client: this.client1, sequenceName });
        let seqDetails2 = await this.getSequenceDetails({ client: this.client2, sequenceName });
        if (seqDetails1.length > 0 && seqDetails2.length === 0) {
          let seqScript = this.#generateCreateSequenceSQL(seqDetails1[0]);
          statements.push(seqScript);
        }
      }
    }

    // Check if default changed
    if (column1.column_default !== column2.column_default) {
      if (column1.column_default !== null) {
        statements.push(`ALTER TABLE ${this.tableName} ALTER COLUMN ${column1.column_name} SET DEFAULT ${column1.column_default};`);
      } else {
        statements.push(`ALTER TABLE ${this.tableName} ALTER COLUMN ${column1.column_name} DROP DEFAULT;`);
      }
    }
    return statements.length > 0 ? statements.join("\n") : null;
  }

  /**
   * Escapes special characters in a string for safe SQL queries.
   * @param {string} str - The string to escape.
   * @returns {string} The escaped string.
   */
  #escapeStringForSql(str) {
    let result = "";
    for (let i = 0; i < str.length; i++) {
      const char = str.charAt(i);
      switch (char) {
        case "'":
          result += "''";
          break;
        case "\\":
          result += "\\\\";
          break;
        case "\n":
          result += "\\n";
          break;
        case "\r":
          result += "\\r";
          break;
        case "\x00":
          result += "\\0";
          break;
        default:
          result += char;
          break;
      }
    }
    return result;
  }

  /**
   * Checks if the given value is a plain JavaScript object.
   *
   * This method uses Object.prototype.toString.call() to perform a strict check
   * ensuring that the value is of type "[object Object]". It excludes arrays,
   * null, dates, and other non-object types.
   *
   * @param {*} obj - The value to be checked.
   * @returns {boolean} - Returns true if the value is a plain object, otherwise false.
   */
  #isObject = (obj) => {
    return Object.prototype.toString.call(obj) === "[object Object]";
  };

  /**
   * Checks if the given value is a valid Date object.
   *
   * This method ensures that the value is an instance of Date and
   * that the date is valid (not NaN).
   *
   * @param {*} obj - The value to be checked.
   * @returns {boolean} - Returns true if the value is a valid Date object, otherwise false.
   */
  #isDate = (obj) => {
    return obj instanceof Date && !isNaN(obj.getTime());
  };

  /**
   * Extracts the sequence name from a PostgreSQL `nextval` string.
   *
   * @param {string} nextvalString - The `nextval` string containing the sequence name.
   *                                Example format: nextval('sequence_name'::regclass)
   *
   * @returns {string|null} - The extracted sequence name if found, otherwise `null`.
   */
  #extractSequenceName(nextvalString) {
    const regex = /'([^']+)'/;
    const match = nextvalString.match(regex);

    if (match && match[1]) {
      return match[1];
    } else {
      return null;
    }
  }

  /**
   * Generates a SQL statement to create a PostgreSQL sequence based on the provided sequence details.
   *
   * @param {Object} sequenceDetails - An object containing details about the sequence.
   * @param {string} sequenceDetails.schemaname - The name of the schema where the sequence resides.
   * @param {string} sequenceDetails.sequencename - The name of the sequence to be created.
   * @param {string} sequenceDetails.data_type - The data type of the sequence (e.g., integer, bigint).
   * @param {number|string} sequenceDetails.start_value - The starting value of the sequence.
   * @param {number|string} sequenceDetails.min_value - The minimum value that the sequence can generate.
   * @param {number|string} sequenceDetails.max_value - The maximum value that the sequence can generate.
   * @param {number|string} sequenceDetails.increment_by - The increment value for the sequence.
   * @param {boolean} sequenceDetails.cycle - Indicates whether the sequence should cycle when the max value is reached.
   * @param {number|string} sequenceDetails.cache_size - The number of sequence values to cache for performance.
   *
   * @returns {string} - A formatted SQL `CREATE SEQUENCE` statement.
   */
  #generateCreateSequenceSQL(sequenceDetails) {
    const { schemaname, sequencename, data_type, start_value, min_value, max_value, increment_by, cycle, cache_size } = sequenceDetails;
    const cycleOption = cycle ? "CYCLE" : "NO CYCLE";

    const createSequenceSQL = `
    CREATE SEQUENCE ${schemaname}.${sequencename}
      AS ${data_type}
      START WITH ${start_value}
      INCREMENT BY ${increment_by}
      MINVALUE ${min_value}
      MAXVALUE ${max_value}
      CACHE ${cache_size}
      ${cycleOption};`;

    return createSequenceSQL.trim();
  }

  /**
   * Extracts the name of a view from a SQL `DROP VIEW` statement.
   *
   * @param {string} sqlString - The SQL string containing the `DROP VIEW` statement.
   * @returns {string|null} - The name of the view if found, otherwise `null`.
   */
  #extractViewName(sqlString) {
    const regex = /DROP\s+VIEW\s+IF\s+EXISTS\s+(\S+);/i;
    const match = sqlString.match(regex);

    if (match && match[1]) {
      return match[1];
    } else {
      return null;
    }
  }

  /**
   * Generates a SQL SELECT statement for a tenant-specific view.
   *
   * This function takes a view name, removes the `_tv` suffix (if present),
   * and constructs a SQL query that filters results by the current tenant ID.
   *
   * @param {string} viewName - The name of the tenant-specific view.
   * @returns {string} A SQL query string that selects all records from the corresponding table,
   *                   filtering by the tenant ID stored in the PostgreSQL setting `app.tenant_id`.
   */
  #generateTenantViewStatement(viewName) {
    let tableName = viewName.replace(/_tv$/, "");
    return `SELECT * FROM ${tableName} WHERE tenant_id = CAST(current_setting('app.tenant_id') AS integer);`;
  }

  /**
   * @function measureExecutionTime
   * @description
   * This method calculates and logs the total time taken since the recorded start time (`this.startTime`).
   * The execution time is displayed in a human-readable format of minutes and seconds.
   */
  measureExecutionTime() {
    // eslint-disable-next-line no-undef
    const endTime = process.hrtime(this.startTime);
    const elapsedTimeInSeconds = endTime[0] + endTime[1] / 1e9;

    // Convert seconds to minutes and seconds
    const minutes = Math.floor(elapsedTimeInSeconds / 60);
    const seconds = (elapsedTimeInSeconds % 60).toFixed(0);

    console.log(`The total process took ${minutes} min ${seconds} sec`);
  }
}
