"use client"

import Link from "next/link"
import * as Dialog from "@radix-ui/react-dialog"
import { ClipboardCheck, LockKeyhole } from "lucide-react"

export function ProfileCompletionGate({ open }: { open: boolean }) {
  if (!open) return null

  return (
    <Dialog.Root open>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[300] bg-slate-950/65 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[301] w-[calc(100vw-1.5rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-white p-6 shadow-2xl focus:outline-none sm:p-7"
          aria-describedby="profile-completion-description"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ClipboardCheck className="h-6 w-6" />
          </span>
          <Dialog.Title className="mt-5 text-2xl font-bold">Complete your profile to continue</Dialog.Title>
          <Dialog.Description id="profile-completion-description" className="mt-2 text-sm leading-6 text-muted-foreground">
            BONU needs your personal, employment and salary information before calculating your membership fee. Your other portal services will remain locked until this step is complete and your membership is activated.
          </Dialog.Description>
          <div className="mt-5 flex items-start gap-3 rounded-lg bg-muted/60 p-4 text-sm">
            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p>After completing your profile, go to Membership and pay the fee equal to 5% of your monthly salary.</p>
          </div>
          <Link
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-5 py-3 font-semibold text-primary-foreground"
            href="/portal/profile"
          >
            Complete my profile
          </Link>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
