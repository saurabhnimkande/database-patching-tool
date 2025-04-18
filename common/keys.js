/* eslint-disable no-undef */
import dotenv from "dotenv";
dotenv.config();

// Database credentials should be added in .env file
export const db1Creds = {
  user: process.env.DB1_USER,
  host: process.env.DB1_HOST,
  database: process.env.DB1_DATABASE,
  password: process.env.DB1_PASSWORD,
  port: process.env.DB1_PORT,
  ssl: process.env.DB1_SSL,
};
export const db2Creds = {
  user: process.env.DB2_USER,
  host: process.env.DB2_HOST,
  database: process.env.DB2_DATABASE,
  password: process.env.DB2_PASSWORD,
  port: process.env.DB2_PORT,
  ssl: process.env.DB2_SSL,
};
