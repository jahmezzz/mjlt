// src/lib/db.ts
'use server';

import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  throw new Error('DATABASE_URL environment variable is not set. Please check your .env file.');
}

// Supabase typically requires SSL connections for its pooler.
// The pooler URL usually includes ?sslmode=require or similar.
// If not, pg defaults to attempting an SSL connection if the server requires it.
// Explicitly setting ssl options can be done if needed.
// For Supabase, if your connection string doesn't specify sslmode,
// you might need: ssl: { rejectUnauthorized: false } for non-localhost.
const pool = new Pool({
  connectionString: connectionString,
  ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1') 
    ? undefined // No SSL for local development unless specified in connectionString
    : { rejectUnauthorized: false }, // Use SSL for non-local, typical for Supabase pooler. For production, ensure proper CA handling.
});

pool.on('connect', () => {
  console.log('Successfully connected to PostgreSQL database via connection pool.');
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  // Depending on your application's needs, you might want to handle this more gracefully,
  // e.g., by attempting to reconnect or exiting the process if the DB is critical.
});

/**
 * Executes a SQL query using a client from the connection pool.
 * @param text The SQL query string.
 * @param params Optional array of parameters for the query.
 * @returns A Promise that resolves with the query result.
 */
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: text.substring(0, 100) + (text.length > 100 ? '...' : ''), duration_ms: duration, rowCount: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error executing query:', { text: text.substring(0, 100) + (text.length > 100 ? '...' : ''), params, error });
    throw error; // Re-throw the error so the calling function can handle it
  }
};

/**
 * Gets a client from the connection pool. Make sure to release it when done.
 * @returns A Promise that resolves with a PostgreSQL client.
 */
export const getClient = async () => {
  const client = await pool.connect();
  console.log('Client acquired from pool.');
  const originalRelease = client.release;
  // Monkey patch a new release function to log when a client is released
  // and ensure it can only be called once.
  let released = false;
  client.release = (err?: boolean | Error) => {
    if (released) {
        console.warn('Attempted to release client that was already released.');
        if (typeof originalRelease === 'function') {
             // If originalRelease is still there (e.g. pg built-in), call it to handle native logic.
            return originalRelease.call(client, err);
        }
        return; // Or handle as appropriate
    }
    released = true;
    client.release = originalRelease; // Restore original release method
    console.log('Releasing client back to pool.');
    return originalRelease.call(client, err);
  };
  return client;
};

// Optional: Gracefully close the pool when the application shuts down.
// Next.js might handle this, but it can be useful in some environments.
// const gracefulShutdown = () => {
//   console.log('Attempting to gracefully shut down database pool...');
//   pool.end()
//     .then(() => console.log('Database pool has been successfully closed.'))
//     .catch(err => console.error('Error closing database pool:', err))
//     .finally(() => process.exit(0));
// };
// process.on('SIGINT', gracefulShutdown);
// process.on('SIGTERM', gracefulShutdown);
