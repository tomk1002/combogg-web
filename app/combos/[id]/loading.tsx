export default function ComboDetailLoading() {
  return (
    <main className="flex-1 max-w-[var(--width-content)] mx-auto px-4 sm:px-8 py-6 sm:py-10 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">

        {/* Right panel skeleton — 모바일에서 먼저 */}
        <div className="flex flex-col gap-4 order-first lg:order-last">
          {/* Champion card */}
          <div className="bg-surface-raised rounded-xl p-5 border border-border">
            <div className="h-3 w-16 bg-surface-overlay rounded animate-pulse mb-3" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-surface-overlay animate-pulse" />
              <div className="flex flex-col gap-1.5">
                <div className="h-4 w-24 bg-surface-overlay rounded animate-pulse" />
                <div className="h-3 w-16 bg-surface-overlay rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Stats card */}
          <div className="bg-surface-raised rounded-xl p-5 border border-border">
            <div className="h-3 w-10 bg-surface-overlay rounded animate-pulse mb-3" />
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className="h-6 w-12 bg-surface-overlay rounded animate-pulse" />
                  <div className="h-2.5 w-10 bg-surface-overlay rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <div className="h-12 rounded-xl bg-surface-raised animate-pulse" />
            <div className="h-10 rounded-xl bg-surface-raised animate-pulse" />
            <div className="h-10 rounded-xl bg-surface-raised animate-pulse" />
          </div>
        </div>

        {/* Left panel skeleton */}
        <div className="flex flex-col gap-6 order-last lg:order-first">
          {/* Video */}
          <div className="aspect-video bg-surface-raised rounded-xl animate-pulse" />

          {/* Title / meta */}
          <div className="flex flex-col gap-2">
            <div className="h-3 w-20 bg-surface-raised rounded animate-pulse" />
            <div className="h-7 w-3/4 bg-surface-raised rounded animate-pulse" />
            <div className="h-4 w-full bg-surface-raised rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-surface-raised rounded animate-pulse" />
          </div>

          {/* Input sequence */}
          <div className="bg-surface-raised rounded-xl p-5 border border-border">
            <div className="h-3 w-20 bg-surface-overlay rounded animate-pulse mb-4" />
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="w-10 h-10 rounded-lg bg-surface-overlay animate-pulse" />
              ))}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
