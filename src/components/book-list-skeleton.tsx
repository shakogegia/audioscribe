import { Skeleton } from "@/components/ui/skeleton"

export function BookListSkeleton({ count = 5 }: { count?: number }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="flex flex-col sm:flex-row gap-2 items-center border rounded-lg p-4">
      <Skeleton className="w-16 h-16 rounded-md shrink-0" />
      <div className="flex flex-col flex-1 gap-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-9 w-20 rounded-md" />
    </div>
  ))
}
