import mysql from 'mysql2/promise';
import { config } from './config.js';

export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60_000,
  queueLimit: 0,
  connectTimeout: 8_000,
  timezone: 'Z',
  dateStrings: true,
  decimalNumbers: true,
  supportBigNumbers: true,
  bigNumberStrings: false,
  namedPlaceholders: true
});

export async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function pingDatabase() {
  const rows = await query(
    'SELECT CURRENT_USER() AS currentUser, DATABASE() AS currentDatabase, UTC_TIMESTAMP() AS utcNow'
  );
  return rows[0];
}

export async function closePool() {
  await pool.end();
}
