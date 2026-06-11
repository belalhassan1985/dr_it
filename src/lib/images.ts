export function toApiUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/api/")) return url;
  if (url.startsWith("/uploads/")) return "/api" + url;
  return "/api/uploads" + url;
}
