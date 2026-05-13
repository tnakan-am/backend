import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function run(): Promise<void> {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'homemade',
  });

  await ds.initialize();
  const opts = ds.options as any;
  console.log(
    `Connected: ${opts.username}@${opts.host}:${opts.port}/${opts.database}`,
  );

  const before = await ds.query(
    `SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`,
  );
  console.log(
    `Tables before: ${
      before.length ? before.map((r: any) => r.tablename).join(', ') : '(none)'
    }`,
  );

  await ds.query('DROP SCHEMA public CASCADE');
  await ds.query('CREATE SCHEMA public');
  await ds.query('GRANT ALL ON SCHEMA public TO public');
  await ds.query(`GRANT ALL ON SCHEMA public TO "${opts.username}"`);

  const after = await ds.query(
    `SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`,
  );
  console.log(
    `Tables after:  ${
      after.length ? after.map((r: any) => r.tablename).join(', ') : '(none)'
    }`,
  );

  await ds.destroy();
  console.log('Schema reset complete.');
}

run().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});
