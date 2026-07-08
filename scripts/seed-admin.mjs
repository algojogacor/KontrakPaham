import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import { existsSync, readFileSync } from "node:fs";

if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    process.env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
}

const db = process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN
  ? new PrismaClient({
      adapter: new PrismaLibSql({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }),
    })
  : new PrismaClient();

const admin = {
  username: "aryarizkyap",
  email: "aryaadmin@admin",
  password: "Arya260408",
  displayName: "Arya Admin",
};

const passwordHash = await bcrypt.hash(admin.password, 12);

try {
  const existingByEmail = await db.user.findUnique({ where: { email: admin.email } });
  if (existingByEmail && existingByEmail.username !== admin.username) {
    throw new Error(`Email admin sudah dipakai oleh username lain: ${existingByEmail.username}`);
  }

  await db.user.upsert({
    where: { username: admin.username },
    update: {
      email: admin.email,
      passwordHash,
      displayName: admin.displayName,
      plan: "ADMIN",
      planExpiresAt: null,
    },
    create: {
      username: admin.username,
      email: admin.email,
      passwordHash,
      displayName: admin.displayName,
      plan: "ADMIN",
      planExpiresAt: null,
    },
  });

  console.log(`Admin ready: ${admin.username} <${admin.email}>`);
} finally {
  await db.$disconnect();
}
