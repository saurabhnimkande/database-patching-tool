import pg from "pg";
const { Client } = pg;

/**
 * Validates database credentials by attempting to connect to the database with a timeout
 * @param {Object} credentials - Database connection credentials
 * @param {string} credentials.user - Database username
 * @param {string} credentials.host - Database host
 * @param {string} credentials.database - Database name
 * @param {string} credentials.password - Database password
 * @param {string} credentials.port - Database port
 * @param {boolean} credentials.ssl - Whether to use SSL connection
 * @param {number} timeout - Timeout duration in milliseconds (default is 5000ms)
 * @returns {Promise<{success: boolean, message: string}>} Validation result
 */
export async function validateDatabaseCredentials(credentials, timeout = 5000) {
  const client = new Client({
    user: credentials.user,
    host: credentials.host,
    database: credentials.database,
    password: credentials.password,
    port: credentials.port,
    ssl: credentials.ssl ? { rejectUnauthorized: false } : false,
  });

  // Create a timeout promise that rejects after the specified time
  const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Connection timeout exceeded")), timeout));

  // Use Promise.race to race between connecting and the timeout
  try {
    await Promise.race([
      client.connect(), // Try connecting to the database
      timeoutPromise, // Timeout promise
    ]);

    // If connected, close the connection
    await client.end();

    return {
      success: true,
      message: "Successfully connected to the database",
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to database: ${error.message}`,
    };
  }
}
