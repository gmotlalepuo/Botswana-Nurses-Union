import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, LockKeyhole } from "lucide-react"

export default function UpdatePasswordPage() {
  return (
    <main className="bonu-auth-shell grid min-h-screen place-items-center bg-background px-5 py-10">
      <section className="bonu-auth-card w-full max-w-md rounded-lg border bg-white p-6 shadow-sm">
        <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Sign in
        </Link>
        <div className="mt-6 flex items-center gap-3">
          <Image src="/bonu-logo.jpg" alt="BONU logo" width={56} height={56} className="bonu-brand-logo h-14 w-14 rounded-md object-contain" />
          <div>
            <p className="text-sm font-semibold text-primary">Botswana Nurses Union</p>
            <h1 className="text-2xl font-bold">Create new password</h1>
          </div>
        </div>
        <form action="/api/auth/update-password" method="post" className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold">New password</span>
            <span className="mt-2 flex items-center gap-2 rounded-md border px-3 py-2">
              <LockKeyhole className="h-4 w-4 text-muted-foreground" />
              <input className="w-full outline-none" name="password" type="password" placeholder="New password" required />
            </span>
          </label>
          <button className="w-full rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground">Update password</button>
        </form>
      </section>
    </main>
  )
}
