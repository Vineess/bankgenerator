import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: ["warn", "error"], // em dev você pode incluir "query"
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
