export default function Loading() {
  return (
    <div className="min-h-screen bg-white flex">
      <aside className="hidden md:flex w-64 flex-col gap-3 border-r border-gray-200 bg-white px-4 py-6">
        <div className="h-6 w-28 rounded bg-gray-200 animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="h-4 w-full rounded bg-gray-100 animate-pulse" />
          ))}
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b border-gray-200 bg-white flex items-center px-4 sm:px-6 lg:px-8 gap-4">
          <div className="h-8 w-32 rounded bg-gray-100 animate-pulse" />
          <div className="flex-1 max-w-lg h-10 rounded bg-gray-100 animate-pulse" />
          <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
        </div>

        <main className="flex-1 bg-white px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          <div className="h-6 w-48 rounded bg-gray-100 animate-pulse" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-20 w-full rounded-lg border border-gray-100 bg-gray-50 animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
