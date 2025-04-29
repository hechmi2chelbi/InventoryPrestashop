
import mysql from 'mysql2/promise';

if (!process.env.MYSQL_HOST || !process.env.MYSQL_USER || !process.env.MYSQL_PASSWORD || !process.env.MYSQL_DATABASE) {
  throw new Error("MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE must be set.");
}

const dbConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE,
  allowPublicKeyRetrieval: true,
};

export const pool = mysql.createPool(dbConfig);
export const db = pool;
