import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.setting.upsert({
    where: { key: "site.name" },
    update: { value: "DR.IT" },
    create: { key: "site.name", value: "DR.IT" },
  });

  await prisma.setting.upsert({
    where: { key: "company.name" },
    update: { value: "DR.IT Technology & Trading" },
    create: { key: "company.name", value: "DR.IT Technology & Trading" },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
