export default function Loading() {
  return (
    <div className="p-8 space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded w-1/4"></div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );
}
