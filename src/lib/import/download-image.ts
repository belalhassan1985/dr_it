import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

export type DownloadedImage = {
  publicUrl: string;
  filePath: string;
  downloaded: boolean;
};

export async function downloadProductImage(imageUrl: string, productId: string, index: number): Promise<DownloadedImage> {
  const extension = extensionFromUrl(imageUrl) ?? "jpg";
  const hash = createHash("sha1").update(imageUrl).digest("hex").slice(0, 10);
  const fileName = `${productId}-${index + 1}-${hash}.${extension}`;
  const targetDir = path.join(process.cwd(), "public", "products");
  const targetPath = path.join(targetDir, fileName);

  await mkdir(targetDir, { recursive: true });

  if (await fileExists(targetPath)) {
    return {
      publicUrl: `/products/${fileName}`,
      filePath: targetPath,
      downloaded: false,
    };
  }

  const response = await fetch(imageUrl, {
    headers: {
      "user-agent": "DR.IT Importer/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Image download failed ${response.status}: ${imageUrl}`);
  }

  const contentTypeExtension = extensionFromContentType(response.headers.get("content-type") ?? "");
  const finalTargetPath = contentTypeExtension && contentTypeExtension !== extension
    ? targetPath.replace(new RegExp(`\\.${extension}$`), `.${contentTypeExtension}`)
    : targetPath;
  const finalPublicUrl = contentTypeExtension && contentTypeExtension !== extension
    ? `/products/${fileName.replace(new RegExp(`\\.${extension}$`), `.${contentTypeExtension}`)}`
    : `/products/${fileName}`;

  await writeFile(finalTargetPath, Buffer.from(await response.arrayBuffer()));

  return {
    publicUrl: finalPublicUrl,
    filePath: finalTargetPath,
    downloaded: true,
  };
}

async function fileExists(filePath: string) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function extensionFromContentType(contentType: string) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  return undefined;
}

function extensionFromUrl(url: string) {
  const clean = url.split("?")[0];
  const extension = clean.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  return extension && ["jpg", "jpeg", "png", "webp"].includes(extension) ? extension.replace("jpeg", "jpg") : undefined;
}
