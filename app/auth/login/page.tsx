import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, LockKeyhole, Mail } from "lucide-react"
import { AuthInformationPanel } from "@/components/auth-information-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  return (
    <main className="bonu-auth-shell grid min-h-screen lg:grid-cols-[minmax(0,0.9fr)_minmax(480px,1.1fr)]">
      <AuthInformationPanel
        title="Your BONU services, applications, and benefits in one secure account."
        description="Sign in to continue managing your membership profile, service applications, monthly deductions, payments, documents, and updates."
        points={[
          "Members are directed to the self-service portal.",
          "CSR users access application and member processing tools.",
          "Administrators access reporting, controls, and user management.",
        ]}
      />

      <section className="grid place-items-center px-5 py-10 lg:px-10">
        <Card className="bonu-auth-card w-full max-w-lg rounded-lg">
          <CardHeader>
            <Link href="/" className="mb-4 inline-flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Return to BONU
            </Link>
            <div className="flex items-center gap-3">
              <Image src="/bonu-logo.jpg" alt="BONU logo" width={52} height={52} className="bonu-brand-logo h-13 w-13 rounded-lg object-contain" />
              <div>
                <CardTitle className="text-2xl">Welcome back</CardTitle>
                <CardDescription>Use your registered BONU account details.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form action="/api/auth/login" method="post" className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="email" className="h-10 pl-10" name="email" type="email" placeholder="member@bonu.org.bw" autoComplete="email" required />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="password">Password</Label>
                  <Link className="text-sm font-semibold text-primary hover:underline" href="/auth/forgot">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="password" className="h-10 pl-10" name="password" type="password" placeholder="Enter your password" autoComplete="current-password" required />
                </div>
              </div>
              <Button className="h-11 w-full" type="submit">Sign in securely</Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              New nurse or member?{" "}
              <Link className="font-semibold text-primary hover:underline" href="/auth/signup">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
