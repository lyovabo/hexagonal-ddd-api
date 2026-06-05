import { Pool } from 'pg';
import { getPool } from '../pool';

const migrations = [
  {
    version: 1,
    name: 'create_orders_table',
    up: `
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY,
        customer_id VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        total_amount DECIMAL(10, 2) NOT NULL,
        total_currency CHAR(3) NOT NULL DEFAULT 'USD',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id VARCHAR(255) NOT NULL,
        product_name VARCHAR(500) NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        unit_price DECIMAL(10, 2) NOT NULL,
        currency CHAR(3) NOT NULL DEFAULT 'USD',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
  },
];

export async function runMigrations(pool: Pool = getPool()): Promise<void> {
  const client = await pool.connect();
  try {
    // Ensure migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const applied = await client.query('SELECT version FROM schema_migrations');
    const appliedVersions = new Set(applied.rows.map((r: any) => r.version));

    for (const migration of migrations) {
      if (!appliedVersions.has(migration.version)) {
        console.log(`Applying migration ${migration.version}: ${migration.name}`);
        await client.query('BEGIN');
        try {
          await client.query(migration.up);
          await client.query(
            'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
            [migration.version, migration.name],
          );
          await client.query('COMMIT');
          console.log(`Migration ${migration.version} applied successfully`);
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        }
      }
    }

    console.log('All migrations applied');
  } finally {
    client.release();
  }
}
