import { prisma } from "@/lib/db";
import { toApiUrl } from "@/lib/images";

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
  const banners = await prisma.banner.findMany({
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
  return banners.map((b) => ({
    ...b,
    imageUrl: toApiUrl(b.imageUrl),
    desktopImageUrl: b.desktopImageUrl ? toApiUrl(b.desktopImageUrl) : null,
    mobileImageUrl: b.mobileImageUrl ? toApiUrl(b.mobileImageUrl) : null,
  }));
}
