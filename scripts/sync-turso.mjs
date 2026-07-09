import { createClient } from "@libsql/client";
import { execSync } from "child_process";
import fs from "fs";
import "dotenv/config";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  console.log("Memulai sinkronisasi database Turso...");

  // 1. Amankan tabel User lama
  const tablesResult = await db.execute("SELECT name FROM sqlite_master WHERE type='table';");
  const oldTables = tablesResult.rows.map(r => r.name);

  let userNeedsMigration = false;
  if (oldTables.includes("User")) {
    const userInfo = await db.execute("PRAGMA table_info(User);");
    if (!userInfo.rows.some(r => r.name === "username")) {
      console.log("Mengamankan tabel User lama...");
      await db.execute("DROP TABLE IF EXISTS User_old;");
      await db.execute("ALTER TABLE User RENAME TO User_old;");
      userNeedsMigration = true;
    }
  }

  // 2. Clone schema Turso ke SQLite lokal
  console.log("Mengambil skema Turso untuk di-diff...");
  const schemaRes = await db.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '%_data' AND name NOT LIKE '%_idx' AND name NOT LIKE '%_docsize' AND name NOT LIKE '%_config' AND name NOT LIKE '%_content';");
  
  if (fs.existsSync("turso_clone.db")) fs.unlinkSync("turso_clone.db");
  const localDb = createClient({ url: "file:./turso_clone.db" });
  for (const row of schemaRes.rows) {
    if (row.sql) await localDb.execute(row.sql);
  }
  localDb.close();

  // 3. Generate Diff SQL
  console.log("Menghasilkan Diff SQL dari Prisma...");
  fs.writeFileSync("temp_dummy.db", "");
  execSync(`npx prisma migrate diff --from-config-datasource prisma.config.clone.ts --to-schema prisma/schema.prisma --script > diff.sql`, { 
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: "file:./temp_dummy.db" }
  });
  
  let diffSql = fs.readFileSync("diff.sql", "utf-8");
  // Hapus PRAGMA foreign_keys=OFF; karena LibSQL via HTTP terkadang tidak mendukungnya dalam transaksi
  diffSql = diffSql.replace(/PRAGMA foreign_keys=OFF;/g, "");
  diffSql = diffSql.replace(/PRAGMA foreign_keys=ON;/g, "");
  diffSql = diffSql.replace(/PRAGMA defer_foreign_keys=ON;/g, "");

  // 4. Eksekusi Diff SQL di Turso
  console.log("Menerapkan perubahan skema ke Turso...");
  if (diffSql.trim() && diffSql.trim() !== "-- This is an empty migration.") {
    await db.executeMultiple(diffSql);
  } else {
    console.log("Tidak ada perubahan skema (selain User).");
  }

  // 5. Kembalikan Data User
  if (userNeedsMigration) {
    console.log("Memulihkan data User...");
    await db.execute(`
      INSERT INTO User (id, username, email, passwordHash, displayName, plan, createdAt, updatedAt)
      SELECT id, email, email, passwordHash, name, UPPER(tier), createdAt, updatedAt FROM User_old;
    `);
    await db.execute("DROP TABLE User_old;");
  }

  // Cleanup
  if (fs.existsSync("turso_clone.db")) fs.unlinkSync("turso_clone.db");
  if (fs.existsSync("diff.sql")) fs.unlinkSync("diff.sql");

  console.log("Sinkronisasi Selesai!");
}

main().catch(console.error);
