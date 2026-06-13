import { LoaderCircle } from "lucide-react"

export default function CsrLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-5">
      <div className="flex items-center gap-3 rounded-xl border bg-white px-6 py-5 shadow-lg" role="status" aria-live="polite">
        <LoaderCircle className="h-7 w-7 animate-spin text-primary" />
        <div>
          <p className="font-bold">Loading CSR portal</p>
          <p className="text-sm text-muted-foreground">Preparing the latest records...</p>
        </div>
      </div>
    </main>
  )
}
