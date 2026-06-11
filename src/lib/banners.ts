import { prisma } from "@/lib/db";

export type StoreBanner = {
  id: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  desktopImageUrl: string | null;
  mobileImageUrl: string | null;
  linkUrl: string | null;
  buttonText: string | null;
};

export async function getActiveBanners(): Promise<StoreBanner[]> {
  return prisma.banner.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      subtitle: true,
      imageUrl: true,
      desktopImageUrl: true,
      mobileImageUrl: true,
      linkUrl: true,
      buttonText: true,
    },
  });
}
