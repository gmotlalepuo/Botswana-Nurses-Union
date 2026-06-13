import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { applicationStages, contact, services } from "@/lib/bonu-data"

export default function Home() {
  return (
    <main className="bonu-shell portal-shell min-h-screen">
      <header className="bonu-header border-b bg-white/90">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="flex items-center gap-3 text-foreground">
            <Image src="/bonu-logo.jpg" alt="BONU logo" width={52} height={52} className="bonu-brand-logo h-13 w-13 rounded-lg object-contain" />
            <div>
              <p className="text-sm font-semibold text-primary">Botswana Nurses Union</p>
              <p className="font-bold">Member Services</p>
            </div>
          </Link>
          <nav className="flex flex-wrap items-center gap-1 text-sm font-medium">
            <Button asChild variant="ghost">
              <a href="#services">Services</a>
            </Button>
            <Button asChild variant="ghost">
              <a href="#contact">Contact</a>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/auth/signup">Register</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="bonu-content border-b border-border/70 bg-white/45">
        <div className="mx-auto grid min-h-[560px] max-w-7xl content-center gap-8 px-5 py-12 lg:grid-cols-[1fr_360px] lg:items-center">
          <div>
            <Badge className="border-primary/20 bg-primary/10 text-primary" variant="outline">
              <ShieldCheck className="h-3.5 w-3.5" />
              Official BONU digital member services
            </Badge>
            <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight md:text-5xl">
              Practical support for Botswana&apos;s nursing community.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              Register, maintain your membership profile, apply for member benefits, submit documents, manage payments, and follow service decisions through one secure account.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/auth/signup">
                  Register as a member
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/auth/login">Sign in to your account</Link>
              </Button>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="relative grid aspect-square w-full max-w-[320px] place-items-center rounded-lg border border-primary/20 bg-white/80 p-8 shadow-xl backdrop-blur">
              <Image src="/bonu-logo.jpg" alt="Botswana Nurses Union" width={240} height={240} className="h-auto w-full object-contain" priority />
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="scroll-mt-28">
        <div className="mx-auto max-w-7xl px-5 py-14">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase text-primary">Member services</p>
            <h2 className="mt-2 text-3xl font-bold">Support built around members</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Use the portal to apply, upload, pay, and track without repeating the same information at every stage.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {services.slice(0, 8).map((service) => {
              const Icon = service.icon
              return (
                <Card className="rounded-lg bg-white/86 transition-transform hover:-translate-y-1" key={service.title}>
                  <CardHeader>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="pt-2 text-lg">{service.title}</CardTitle>
                    <CardDescription className="leading-6">{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">{service.metric}</Badge>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-border/70 bg-white/60">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <div className="grid gap-5 md:grid-cols-3">
            {applicationStages.slice(0, 3).map((stage, index) => (
              <div className="flex gap-4" key={stage.label}>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-bold">{stage.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{stage.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-28">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-bold uppercase text-primary">Contact BONU</p>
            <h2 className="mt-2 text-3xl font-bold">How can we help?</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Send a membership or service enquiry. Your message will enter the BONU support register for follow-up.
            </p>
            <Separator className="my-6" />
            <div className="grid gap-4 text-sm">
              <ContactLine icon={MapPin} text={contact.address} />
              <ContactLine icon={Phone} text={contact.phone} />
              <ContactLine icon={Mail} text={contact.email} />
              <ContactLine icon={MessageCircle} text={`WhatsApp ${contact.whatsapp}`} />
            </div>
          </div>

          <Card className="rounded-lg bg-white/88">
            <CardHeader>
              <CardTitle>Send an enquiry</CardTitle>
              <CardDescription>Provide enough detail for the right BONU team to respond.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action="/api/contact" method="post" className="grid gap-4 md:grid-cols-2">
                <ContactField id="name" label="Full name" name="name" placeholder="Your full name" required />
                <ContactField id="email" label="Email address" name="email" placeholder="name@example.com" required type="email" />
                <ContactField id="phone" label="Phone number" name="phone" placeholder="+267 ..." />
                <ContactField id="subject" label="Subject" name="subject" placeholder="How can BONU assist?" required />
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" className="min-h-32" name="message" placeholder="Describe your enquiry" required />
                </div>
                <Button className="h-11 md:col-span-2" type="submit">Submit enquiry</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t bg-surface-strong text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Image src="/bonu-logo.jpg" alt="BONU logo" width={44} height={44} className="h-11 w-11 rounded-lg bg-white object-contain" />
            <div>
              <p className="font-bold">Botswana Nurses Union</p>
              <p className="text-sm text-cyan-50">Professional support for nurses across Botswana.</p>
            </div>
          </div>
          <p className="text-sm text-cyan-50">Phiri Crescent, Ext 9, Plot 2684, Gaborone</p>
        </div>
      </footer>
    </main>
  )
}

function ContactField({ id, label, ...props }: { id: string; label: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} className="h-10" {...props} />
    </div>
  )
}

function ContactLine({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <p className="flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="pt-2">{text}</span>
    </p>
  )
}
