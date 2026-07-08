import { mock } from "bun:test";
mock.module("@/lib/db", () => {
  return { db: {} };
});
mock.module("@prisma/client", () => {
  return { PrismaClient: class {} };
});
