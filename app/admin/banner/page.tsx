import { prisma } from "@/lib/db";
import BannerForm from "./banner-form";

export const dynamic = "force-dynamic";

export default async function AdminBannerPage() {
  const banner = await prisma.siteBanner.findUnique({ where: { id: 1 } });

  const initial = banner
    ? {
        enabled: banner.enabled,
        message: banner.message,
        variant: banner.variant,
      }
    : { enabled: false, message: "", variant: "info" };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black">사이트 배너</h1>
        <p className="text-sm text-text-muted mt-1">상단에 표시되는 전역 배너 — 공지·점검·경고에 사용</p>
      </div>

      <BannerForm initial={initial} />
    </div>
  );
}
