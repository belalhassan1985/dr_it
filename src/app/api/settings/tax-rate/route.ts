import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseTaxRate } from "@/lib/money";

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "tax.rate" },
    });
    const taxRate = parseTaxRate(setting?.value);
    return NextResponse.json({ taxRate });
  } catch {
    return NextResponse.json({ taxRate: 0.05 });
  }
}
