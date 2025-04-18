import pg from 'pg';
const { Client } = pg;

/**
 * Validates database credentials by attempting to connect to the database
 * @param {Object} credentials - Database connection credentials
 * @param {string} credentials.user - Database username
 * @param {string} credentials.host - Database host
 * @param {string} credentials.database - Database name
 * @param {string} credentials.password - Database password
 * @param {string} credentials.port - Database port
 * @param {boolean} credentials.ssl - Whether to use SSL connection
 * @returns {Promise<{success: boolean, message: string}>} Validation result
 */
export async function validateDatabaseCredentials(credentials) {
  const client = new Client({
    user: credentials.user,
    host: credentials.host,
    database: credentials.database,
    password: credentials.password,
    port: credentials.port,
    ssl: credentials.ssl ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    await client.connect();
    await client.end();
    return {
      success: true,
      message: 'Successfully connected to the database'
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to database: ${error.message}`
    };
  }
} 