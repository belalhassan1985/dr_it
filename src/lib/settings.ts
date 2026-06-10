import { prisma } from "@/lib/db";

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const settings = await prisma.setting.findMany({
    where: { key: { in: keys } },
  });
  const map: Record<string, string> = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }
  for (const key of keys) {
    if (!(key in map)) map[key] = "";
  }
  return map;
}
