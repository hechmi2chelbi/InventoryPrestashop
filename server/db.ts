
import mysql from 'mysql2/promise';

if (!process.env.MYSQL_HOST || !process.env.MYSQL_USER || !process.env.MYSQL_PASSWORD || !process.env.MYSQL_DATABASE) {
  throw new Error("MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE must be set.");
}

const dbConfig = {
  host: "127.0.0.1",
  user: "prestasynch",
  password: "1DhbQ[XdK2_6Jzr0",
  database: "prestasynch",
  
};

export const pool = mysql.createPool(dbConfig);
export const db = pool;
