import { LoaderCircle } from "lucide-react"

export default function MemberPortalLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-5">
      <div className="flex items-center gap-3 rounded-xl border bg-white px-6 py-5 shadow-lg" role="status" aria-live="polite">
        <LoaderCircle className="h-7 w-7 animate-spin text-primary" />
        <div>
          <p className="font-bold">Loading BONU Self Service</p>
          <p className="text-sm text-muted-foreground">Preparing your latest information...</p>
        </div>
      </div>
    </main>
  )
}
