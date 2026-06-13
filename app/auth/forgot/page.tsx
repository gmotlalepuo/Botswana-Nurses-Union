import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  return (
    <main className="bonu-auth-shell grid min-h-screen place-items-center bg-background px-5 py-10">
      <section className="bonu-auth-card w-full max-w-md rounded-lg border bg-white p-6 shadow-sm">
        <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
        <div className="mt-6 flex items-center gap-3">
          <Image src="/bonu-logo.jpg" alt="BONU logo" width={56} height={56} className="bonu-brand-logo h-14 w-14 rounded-md object-contain" />
          <div>
            <p className="text-sm font-semibold text-primary">Botswana Nurses Union</p>
            <h1 className="text-2xl font-bold">Reset password</h1>
          </div>
        </div>
        <form action="/api/auth/forgot" method="post" className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold">Email address</span>
            <span className="mt-2 flex items-center gap-2 rounded-md border px-3 py-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <input className="w-full outline-none" name="email" type="email" placeholder="member@bonu.org.bw" required />
            </span>
          </label>
          <button className="w-full rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground">Send reset link</button>
        </form>
      </section>
    </main>
  )
}
