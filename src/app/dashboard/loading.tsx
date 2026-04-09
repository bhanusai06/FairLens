export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-bg">
      <div className="h-1 bg-accent/30 animate-pulse" />

      <nav className="glass border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="w-20 h-5 skeleton rounded-lg" />
          <div className="w-32 h-5 skeleton rounded-lg" />
          <div className="flex gap-3">
            <div className="w-24 h-8 skeleton rounded-lg" />
            <div className="w-32 h-8 skeleton rounded-lg" />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="w-48 h-8 skeleton rounded-xl mb-2" />
        <div className="w-72 h-4 skeleton rounded-lg mb-8" />

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="h-64 skeleton rounded-2xl" />
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 skeleton rounded-2xl" />
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="h-40 skeleton rounded-2xl" />
          <div className="h-40 skeleton rounded-2xl" />
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="h-56 skeleton rounded-2xl" />
          <div className="h-56 skeleton rounded-2xl" />
        </div>
      </div>
    </main>
  );
}
