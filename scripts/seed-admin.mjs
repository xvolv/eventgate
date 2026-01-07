import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";
import { scryptAsync } from "@noble/hashes/scrypt.js";

const prisma = new PrismaClient();

const config = {
  N: 16384,
  r: 16,
  p: 1,
  dkLen: 64,
};

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = await scryptAsync(password.normalize("NFKC"), salt, {
    N: config.N,
    p: config.p,
    r: config.r,
    dkLen: config.dkLen,
    maxmem: 128 * config.N * config.r * 2,
  });

  return `${salt}:${Buffer.from(key).toString("hex")}`;
}

async function main() {
  const email = (process.env.ADMIN_EMAIL || "salassefa@gmail.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "minemine";

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: "Admin",
      emailVerified: true,
    },
    create: {
      email,
      name: "Admin",
      emailVerified: true,
    },
  });

  const passwordHash = await hashPassword(password);

  await prisma.account.upsert({
    where: { providerId_accountId: { providerId: "credential", accountId: user.id } },
    update: {
      password: passwordHash,
      userId: user.id,
    },
    create: {
      userId: user.id,
      providerId: "credential",
      accountId: user.id,
      password: passwordHash,
    },
  });

  await prisma.systemRoleGrant.upsert({
    where: { email_role: { email, role: "ADMIN" } },
    update: {},
    create: { email, role: "ADMIN" },
  });

  console.log("Seeded admin:", { email, password, userId: user.id });
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
