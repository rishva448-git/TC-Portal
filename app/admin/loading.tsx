export default function AdminLoading() {
  return (
    <div className="space-y-8 pb-12 animate-pulse max-w-[1600px] w-full mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 border-b border-gray-800 pb-5 sm:pb-6">
        <div className="space-y-2 w-full max-w-md">
          <div className="h-7 w-52 rounded-xl bg-gray-800" />
          <div className="h-3 w-80 rounded bg-gray-800" />
        </div>
        <div className="h-7 w-32 rounded-xl bg-gray-800" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-20 rounded-2xl bg-gray-800/80" />
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 rounded-2xl bg-gray-800/80" />
        ))}
      </div>
    </div>
  );
}
