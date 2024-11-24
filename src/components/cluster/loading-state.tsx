export function LoadingState() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-none p-6 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-24 bg-muted rounded animate-pulse" />
            <div className="h-9 w-24 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
