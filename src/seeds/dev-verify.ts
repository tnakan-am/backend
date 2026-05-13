import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

// Usage:
//   npx ts-node src/seeds/dev-verify.ts                      -> verifies all users
//   npx ts-node src/seeds/dev-verify.ts admin@x.com admin    -> verifies + sets type
async function run(): Promise<void> {
  const email = process.argv[2];
  const type = process.argv[3];

  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'homemade',
  });

  await ds.initialize();

  if (email) {
    const result = await ds.query(
      `UPDATE users
         SET verified = true,
             "verifiedAt" = NOW(),
             "verificationToken" = NULL
             ${type ? ', type = $2' : ''}
       WHERE email = $1
       RETURNING id, email, type, verified`,
      type ? [email.toLowerCase(), type] : [email.toLowerCase()],
    );
    console.log('Updated:', result);
  } else {
    const result = await ds.query(
      `UPDATE users
         SET verified = true,
             "verifiedAt" = NOW(),
             "verificationToken" = NULL
       RETURNING id, email, type, verified`,
    );
    console.log(`Verified ${result.length} users:`);
    for (const u of result) {
      console.log(`  ${u.email} (${u.type})`);
    }
  }

  await ds.destroy();
}

run().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
