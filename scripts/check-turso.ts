import { createClient } from '@libsql/client';
import * as path from 'path';
import * as fs from 'fs';

// Read .env file natively
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const eqIdx = trimmed.indexOf('=');
      const key = trimmed.substring(0, eqIdx).trim();
      let val = trimmed.substring(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

async function main() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

  if (!tursoUrl || !tursoAuthToken) {
    console.error('TURSO_DATABASE_URL or TURSO_AUTH_TOKEN missing in .env');
    process.exit(1);
  }

  const url = tursoUrl.startsWith('libsql://')
    ? tursoUrl.replace('libsql://', 'https://')
    : tursoUrl;

  const client = createClient({ url, authToken: tursoAuthToken });

  console.log('Connecting to Turso Cloud DB at:', url);
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table';");
  console.log('Tables in Turso:', tables.rows.map(r => r.name));

  for (const row of tables.rows) {
    const tableName = row.name as string;
    if (tableName.startsWith('_') || tableName.startsWith('sqlite_')) continue;
    const count = await client.execute(`SELECT COUNT(*) as cnt FROM "${tableName}";`);
    console.log(`Table ${tableName}: ${count.rows[0].cnt} rows`);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
