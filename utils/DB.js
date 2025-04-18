import pg from 'pg';
const { Client } = pg;

export default class DB {
  client = {};

  /**
   * Constructor for the DB class.
   * If connection parameters are provided, it creates a new Client instance.
   * Otherwise, it uses the provided client.
   * @param {Object} params - The initialization parameters.
   * @param {string} [params.user] - The database user.
   * @param {string} [params.host] - The database host.
   * @param {string} [params.database] - The database name.
   * @param {string} [params.password] - The database password.
   * @param {number} [params.port] - The database port.
   * @param {boolean} [params.ssl] - Use SSL for the connection.
   * @param {Object} [params.client] - An existing database client.
   */
  constructor({ user, host, database, password, port, ssl, client }) {
    if (user && host && database && password && port) {
      this.client = new Client({
        user: user,
        host: host,
        database: database,
        password: password,
        port: port,
        ssl: ssl ?? true,
      });
    } else {
      this.client = client;
    }
  }

  /**
   * Executes a SQL query using the database client.
   * @param {string} sql - The SQL query string.
   * @param {Array|null} params - Optional parameters for the query.
   * @returns {Promise<Object>} The query result.
   */
  async executeQuery(sql, params = null) {
    return this.client.query(sql, params);
  }

  /**
   * Starts a new database transaction with optional timeout settings.
   * Connects the client and issues a BEGIN along with optional configuration commands.
   * @param {number|null} baseTime - Base time for configuring timeouts.
   * @returns {Promise<Object>} The database client.
   */
  async startTransaction(baseTime = null) {
    const idleInTxnSessionTimeout = baseTime;
    const statementTimeoutTime = baseTime ? baseTime / 2 : null;
    try {
      let txnQuerySet = [];
      txnQuerySet.push("BEGIN");
      txnQuerySet.push("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
      if (baseTime) {
        txnQuerySet.push(`SET idle_in_transaction_session_timeout = ${idleInTxnSessionTimeout}`);
        txnQuerySet.push(`SET statement_timeout = ${statementTimeoutTime}`);
      }
      // Join queries with a semicolon
      const txnQuery = txnQuerySet.join("; ");
      await this.client.connect();

      await this.executeQuery(txnQuery);
      return this.client;
    } catch (err) {
      await this.client.query("ROLLBACK");
      throw err;
    }
  }

  /**
   * Commits the current transaction.
   * In case of failure, it attempts a rollback.
   * @returns {Promise<void>}
   */
  async commitTransaction() {
    try {
      await this.client.query("COMMIT");
    } catch (err) {
      await this.client.query("ROLLBACK");
      throw err;
    }
  }

  /**
   * Rolls back the current transaction.
   * @returns {Promise<void>}
   */
  async rollbackTransaction() {
    await this.client.query("ROLLBACK");
  }

  /**
   * Releases the database client from the connection pool.
   * @returns {Promise<void>}
   */
  async releaseTransaction() {
    await this.client.release();
  }

  /**
   * Ends the database connection.
   * @returns {Promise<void>}
   */
  async endTransaction() {
    await this.client.end();
  }
};
