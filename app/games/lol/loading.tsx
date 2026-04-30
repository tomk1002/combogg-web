export default function LolLoading() {
  return (
    <main className="flex-1 max-w-[var(--width-content)] mx-auto px-4 sm:px-8 py-6 sm:py-10 w-full">
      {/* 헤더 skeleton */}
      <div className="flex items-center gap-4 mb-8 pb-8 border-b border-border">
        <div className="flex flex-col gap-2">
          <div className="h-7 w-56 bg-surface-raised rounded animate-pulse" />
          <div className="h-4 w-32 bg-surface-raised rounded animate-pulse" />
        </div>
        <div className="ml-auto h-9 w-20 bg-surface-raised rounded-lg animate-pulse" />
      </div>

      {/* 필터 바 skeleton */}
      <div className="mb-6">
        <div className="h-12 bg-surface-raised rounded-xl animate-pulse" />
      </div>

      {/* 카드 그리드 skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-[4/3] bg-surface-raised rounded-xl animate-pulse" />
        ))}
      </div>
    </main>
  );
}
