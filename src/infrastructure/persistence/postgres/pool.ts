import { Pool, PoolConfig } from 'pg';
import { config } from '../../../config';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const poolConfig: PoolConfig = {
      host: config.postgres.host,
      port: config.postgres.port,
      database: config.postgres.database,
      user: config.postgres.user,
      password: config.postgres.password,
      min: config.postgres.pool.min,
      max: config.postgres.pool.max,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };
    pool = new Pool(poolConfig);

    pool.on('error', (err) => {
      console.error('Unexpected PostgreSQL pool error', err);
    });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function checkPostgresHealth(): Promise<boolean> {
  try {
    const client = await getPool().connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch {
    return false;
  }
}
