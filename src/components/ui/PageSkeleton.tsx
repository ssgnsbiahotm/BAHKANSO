import { useEffect, useState } from 'react';

export function PageSkeleton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950" aria-busy="true" aria-label="Chargement de la page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="h-10 w-40 animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
          <div className="h-10 w-48 animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
        </div>

        {/* Hero/Content skeleton */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="h-6 w-32 animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded" />
            <div className="h-12 w-3/4 animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded" />
            <div className="h-12 w-1/2 animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded" />
            <div className="h-10 w-48 animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded" />
          </div>
          <div className="aspect-[4/3] animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
        </div>

        {/* Section skeletons */}
        <div className="mt-16 space-y-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <div className="h-8 w-40 animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded" />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="space-y-3 p-6 animate-pulse bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl">
                    <div className="h-12 w-12 animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
                    <div className="h-6 w-3/4 animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded" />
                    <div className="h-4 w-full animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded" />
                    <div className="h-4 w-2/3 animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SectionSkeleton({ columns = 3 }: { columns?: number }) {
  return (
    <div className={`grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns}`} aria-busy="true">
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="p-6 animate-pulse bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl space-y-3">
          <div className="h-10 w-10 animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
          <div className="h-6 w-3/4 animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded" />
          <div className="h-4 w-full animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded" />
          <div className="h-4 w-1/2 animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-x-auto" aria-busy="true">
      <table className="w-full">
        <thead>
          <tr className="bg-neutral-50 dark:bg-neutral-900">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <div className="h-4 w-24 animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, row) => (
            <tr key={row} className={row % 2 === 0 ? 'bg-white' : 'bg-neutral-50 dark:bg-neutral-900/50'}>
              {Array.from({ length: cols }).map((_, col) => (
                <td key={col} className="px-4 py-3">
                  <div className="h-4 w-full animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}