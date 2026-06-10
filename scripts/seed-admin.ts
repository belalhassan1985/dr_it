import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "DR.IT Admin";

  if (!email) throw new Error("ADMIN_EMAIL is required");
  if (!password || password.length < 8) throw new Error("ADMIN_PASSWORD must be at least 8 characters");

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash: await hashPassword(password),
      role: "ADMIN",
      isActive: true,
    },
    create: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role: "ADMIN",
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  console.log(`Seeded admin ${user.email} (${user.role}, active=${user.isActive})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
