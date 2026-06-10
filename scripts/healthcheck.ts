import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function healthcheck() {
  console.log("=== DR.IT Health Check ===\n");
  let allPassed = true;

  try {
    await prisma.$connect();
    console.log("[PASS] Database connection: OK");
  } catch {
    console.error("[FAIL] Database connection: FAILED");
    allPassed = false;
    await prisma.$disconnect();
    process.exitCode = 1;
    return;
  }

  try {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount > 0) {
      console.log(`[PASS] Admin users: ${adminCount}`);
    } else {
      console.error("[FAIL] Admin users: 0 (run: npm run seed:admin)");
      allPassed = false;
    }
  } catch {
    console.error("[FAIL] Admin users: query failed");
    allPassed = false;
  }

  try {
    const productCount = await prisma.product.count();
    if (productCount > 0) {
      console.log(`[PASS] Products: ${productCount}`);
    } else {
      console.warn("[WARN] Products: 0 (run: npm run sync:anas)");
    }
  } catch {
    console.error("[FAIL] Products: query failed");
    allPassed = false;
  }

  try {
    const categoryCount = await prisma.category.count();
    if (categoryCount > 0) {
      console.log(`[PASS] Categories: ${categoryCount}`);
    } else {
      console.warn("[WARN] Categories: 0");
    }
  } catch {
    console.error("[FAIL] Categories: query failed");
    allPassed = false;
  }

  try {
    const brandCount = await prisma.brand.count();
    if (brandCount > 0) {
      console.log(`[PASS] Brands: ${brandCount}`);
    } else {
      console.warn("[WARN] Brands: 0");
    }
  } catch {
    console.error("[FAIL] Brands: query failed");
    allPassed = false;
  }

  try {
    const orderCount = await prisma.order.count();
    console.log(`[INFO] Orders: ${orderCount}`);
  } catch {
    console.warn("[WARN] Orders: could not count");
  }

  try {
    const lastSync = await prisma.syncRun.findFirst({ orderBy: { startedAt: "desc" } });
    if (lastSync) {
      console.log(`[INFO] Last sync: ${lastSync.status} at ${lastSync.startedAt.toISOString()}`);
    } else {
      console.log("[INFO] Last sync: none");
    }
  } catch {
    console.log("[INFO] Last sync: table not found or empty");
  }

  const authSecret = process.env.AUTH_SECRET;
  if (authSecret && authSecret !== "REPLACE_WITH_RANDOM_64_CHAR_STRING" && authSecret !== "change-me-dr-it-auth-secret" && authSecret.length >= 32) {
    console.log("[PASS] AUTH_SECRET: configured");
  } else {
    console.error("[FAIL] AUTH_SECRET: not set or using default value - MUST change for production");
    allPassed = false;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl && siteUrl !== "") {
    console.log(`[PASS] NEXT_PUBLIC_SITE_URL: ${siteUrl}`);
  } else {
    console.warn("[WARN] NEXT_PUBLIC_SITE_URL: not set");
  }

  console.log("\n=== Result ===");
  if (allPassed) {
    console.log("All critical checks passed!");
  } else {
    console.error("Some checks FAILED. Fix the issues above before launching.");
    process.exitCode = 1;
  }

  await prisma.$disconnect();
}

healthcheck();