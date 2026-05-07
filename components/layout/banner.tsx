import { prisma } from "@/lib/db";

// Re-fetched at most once per minute on the server. Banner row is shared
// site-wide so per-user caching isn't necessary.
export const revalidate = 60;

const VARIANT_CLASSES: Record<string, string> = {
  info: "bg-surface-overlay text-text border-b border-border",
  warning: "bg-medium/15 text-medium border-b border-medium/40",
  announcement: "bg-gold/15 text-gold border-b border-gold/40",
};

export default async function SiteBanner() {
  let banner: { enabled: boolean; message: string; variant: string } | null = null;
  try {
    banner = await prisma.siteBanner.findUnique({
      where: { id: 1 },
      select: { enabled: true, message: true, variant: true },
    });
  } catch {
    // DB error during build/preview — fail open (no banner).
    return null;
  }

  if (!banner || !banner.enabled || !banner.message.trim()) return null;

  const className = VARIANT_CLASSES[banner.variant] ?? VARIANT_CLASSES.info;

  return (
    <div className={`w-full ${className}`} role="status">
      <div className="max-w-[var(--width-content)] mx-auto px-4 sm:px-8 py-2 text-sm font-medium text-center">
        {banner.message}
      </div>
    </div>
  );
}
