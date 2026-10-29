import { Skeleton } from './ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in" aria-label="看板数据加载中">
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-[174px] rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-8 w-20" />
                </div>
                <Skeleton className="h-9 w-9 rounded-xl" />
              </div>
              <Skeleton className="mt-6 h-2 w-full" />
              <Skeleton className="mt-3 h-3 w-24" />
            </div>
          ))}
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-12">
        <Skeleton className="h-80 rounded-2xl lg:col-span-8" />
        <Skeleton className="h-80 rounded-2xl lg:col-span-4" />
      </div>
    </div>
  );
}
