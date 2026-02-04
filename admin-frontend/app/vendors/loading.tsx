export default function Loading() {
  return (
    <div className="p-8 space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-8 bg-gray-200 rounded w-32"></div>
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>
      <div className="h-96 bg-gray-200 rounded-lg"></div>
    </div>
  );
}
