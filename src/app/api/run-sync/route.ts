import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth/session";
import { runAnasImport } from "@/lib/import/anas-importer";

export async function POST() {
  try {
    await requireAdminUser();
    const result = await runAnasImport();
    return NextResponse.json(result, { status: result.status === "failed" ? 500 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === "Unauthorized admin action") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json(
      { status: "failed", error: message },
      { status: 500 },
    );
  }
}
