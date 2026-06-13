import Image from "next/image"
import { CheckCircle2, Headphones, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type AuthInformationPanelProps = {
  title: string
  description: string
  points: string[]
}

export function AuthInformationPanel({ title, description, points }: AuthInformationPanelProps) {
  return (
    <aside className="flex min-h-[320px] flex-col justify-between bg-surface-strong p-6 text-white lg:min-h-screen lg:p-10">
      <div>
        <div className="flex items-center gap-3">
          <Image
            src="/bonu-logo.jpg"
            alt="Botswana Nurses Union logo"
            width={64}
            height={64}
            className="h-16 w-16 rounded-lg border border-white/20 bg-white object-contain p-1"
          />
          <div>
            <p className="font-bold">Botswana Nurses Union</p>
            <p className="text-sm text-cyan-50">Member Services Platform</p>
          </div>
        </div>

        <Badge className="mt-10 border-white/20 bg-white/10 text-white" variant="outline">
          Secure member access
        </Badge>
        <h1 className="mt-4 max-w-xl text-3xl font-bold leading-tight lg:text-4xl">{title}</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-cyan-50">{description}</p>

        <div className="mt-8 grid gap-3">
          {points.map((point) => (
            <div className="flex items-start gap-3 rounded-lg border border-white/15 bg-white/8 p-3" key={point}>
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <p className="text-sm leading-6 text-white">{point}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-3 text-sm text-cyan-50 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <p className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-accent" />
          Protected account access
        </p>
        <p className="flex items-center gap-2">
          <Headphones className="h-4 w-4 text-accent" />
          Support: 395 3840
        </p>
      </div>
    </aside>
  )
}
