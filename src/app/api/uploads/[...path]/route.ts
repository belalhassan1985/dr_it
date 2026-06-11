import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

type RouteParams = { params: Promise<{ path: string[] }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { path: segments } = await params;
  if (!segments || segments.length === 0) {
    return new NextResponse(null, { status: 400 });
  }

  const relativePath = segments.join("/");
  const ext = relativePath.split(".").pop()?.toLowerCase() || "";
  const contentType = MIME_MAP[ext] || "application/octet-stream";

  // Try new location: project-root/uploads/
  const newFilePath = path.join(process.cwd(), "uploads", relativePath);
  if (existsSync(newFilePath)) {
    const buffer = await readFile(newFilePath);
    return new NextResponse(buffer, {
      status: 200,
      headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  }

  // Fallback: public/uploads/ (old banners)
  const oldFilePath = path.join(process.cwd(), "public", "uploads", relativePath);
  if (existsSync(oldFilePath)) {
    const buffer = await readFile(oldFilePath);
    return new NextResponse(buffer, {
      status: 200,
      headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  }

  // Fallback: public/{path} (old product images stored in public/products/)
  const publicFilePath = path.join(process.cwd(), "public", relativePath);
  if (existsSync(publicFilePath)) {
    const buffer = await readFile(publicFilePath);
    return new NextResponse(buffer, {
      status: 200,
      headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  }

  return new NextResponse(null, { status: 404 });
}
