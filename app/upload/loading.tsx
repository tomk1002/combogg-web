export default function UploadLoading() {
  return (
    <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-8 py-10 w-full">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-surface-raised animate-pulse" />
            {i < 3 && <div className="h-px w-10 bg-surface-raised animate-pulse" />}
          </div>
        ))}
      </div>

      {/* Upload area */}
      <div className="h-48 rounded-xl border-2 border-dashed border-border bg-surface-raised animate-pulse mb-6" />

      {/* Form fields */}
      <div className="flex flex-col gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="h-3.5 w-20 bg-surface-raised rounded animate-pulse" />
            <div className="h-10 bg-surface-raised rounded-lg animate-pulse" />
          </div>
        ))}
        <div className="h-12 bg-surface-raised rounded-xl animate-pulse mt-2" />
      </div>
    </main>
  );
}
