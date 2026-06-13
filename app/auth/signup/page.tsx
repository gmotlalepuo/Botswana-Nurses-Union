import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, BadgeCheck, BriefcaseBusiness, LockKeyhole, Mail, Phone, UserRound } from "lucide-react"
import { AuthInformationPanel } from "@/components/auth-information-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignupPage() {
  return (
    <main className="bonu-auth-shell grid min-h-screen lg:grid-cols-[minmax(0,0.85fr)_minmax(560px,1.15fr)]">
      <AuthInformationPanel
        title="Join BONU and manage your membership from one dependable platform."
        description="Registration creates your secure member account. You can then complete your profile, upload verification documents, apply for services, and follow every decision."
        points={[
          "Register using your personal contact and employment information.",
          "Complete your member profile and upload supporting documents.",
          "Apply for BONU benefits after your account is ready.",
        ]}
      />

      <section className="grid place-items-center px-5 py-10 lg:px-10">
        <Card className="bonu-auth-card w-full max-w-2xl rounded-lg">
          <CardHeader>
            <Link href="/" className="mb-4 inline-flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Return to BONU
            </Link>
            <div className="flex items-center gap-3">
              <Image src="/bonu-logo.jpg" alt="BONU logo" width={52} height={52} className="bonu-brand-logo h-13 w-13 rounded-lg object-contain" />
              <div>
                <CardTitle className="text-2xl">Create your member account</CardTitle>
                <CardDescription>For nurses and prospective BONU members.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form action="/api/auth/signup" method="post" className="grid gap-4 md:grid-cols-2">
              <AuthField className="md:col-span-2" icon={UserRound} id="fullName" label="Full name" name="fullName" placeholder="Your full legal name" required />
              <AuthField icon={Mail} id="email" label="Email address" name="email" placeholder="name@example.com" required type="email" />
              <AuthField icon={Phone} id="mobileNumber" label="Mobile number" name="mobileNumber" placeholder="+267 ..." required />
              <AuthField icon={BadgeCheck} id="nationalId" label="National ID / Passport" name="nationalId" placeholder="ID or passport number" />
              <AuthField icon={BriefcaseBusiness} id="employer" label="Employer" name="employer" placeholder="Hospital or clinic" />
              <AuthField icon={BriefcaseBusiness} id="employeeNumber" label="Employee number" name="employeeNumber" placeholder="Employee number" />
              <AuthField icon={LockKeyhole} id="password" label="Password" name="password" placeholder="At least 8 characters" required type="password" />
              <Button className="h-11 md:col-span-2" type="submit">Create member account</Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already registered?{" "}
              <Link className="font-semibold text-primary hover:underline" href="/auth/login">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

function AuthField({
  icon: Icon,
  id,
  label,
  className,
  ...inputProps
}: {
  icon: typeof UserRound
  id: string
  label: string
  className?: string
} & React.ComponentProps<typeof Input>) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input id={id} className="h-10 pl-10" {...inputProps} />
      </div>
    </div>
  )
}
