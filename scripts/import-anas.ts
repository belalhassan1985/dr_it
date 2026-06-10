import { runAnasImport } from "../src/lib/import/anas-importer";

async function main() {
  const result = await runAnasImport();
  console.log(JSON.stringify(result, null, 2));

  if (result.status === "failed") {
    process.exit(1);
  }

  if (result.status === "skipped") {
    console.warn(`Sync skipped: ${result.error}`);
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
