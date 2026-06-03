export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center gap-2">
        <div
          className="h-6 w-6 animate-spin rounded-full border-2 border-padel-600 border-t-transparent"
          role="status"
          aria-label="Indlæser"
        />
        <span className="text-sm text-gray-500">Indlæser...</span>
      </div>
    </div>
  )
}
