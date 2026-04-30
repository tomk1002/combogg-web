export default function HomeLoading() {
  return (
    <main className="flex-1">
      {/* Hero skeleton */}
      <section className="border-b border-border">
        <div className="max-w-[var(--width-content)] mx-auto px-4 sm:px-8 py-10 sm:py-16">
          <div className="h-[280px] bg-surface-raised rounded-2xl animate-pulse" />
        </div>
      </section>

      {/* Combo card grid skeleton */}
      <div className="max-w-[var(--width-content)] mx-auto px-4 sm:px-8 py-10">
        <div className="h-6 w-32 bg-surface-raised rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-[4/3] bg-surface-raised rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  );
}
