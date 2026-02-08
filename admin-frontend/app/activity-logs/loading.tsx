export default function Loading() {
  return (
    <div className="p-8 space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-8 bg-gray-200 rounded w-48"></div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="h-24 bg-gray-200 rounded"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
      <div className="h-96 bg-gray-200 rounded-lg"></div>
    </div>
  );
}
