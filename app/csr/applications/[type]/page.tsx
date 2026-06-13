import { notFound } from "next/navigation"
import { CsrSectionPage } from "@/app/csr/csr-section-page"
import { getCsrApplicationType } from "@/lib/csr-application-types"

export default async function CsrApplicationTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  const application = getCsrApplicationType(type)

  if (!application) {
    notFound()
  }

  return (
    <CsrSectionPage
      title={`${application.label} applications`}
      description={`Review and process submitted ${application.label.toLowerCase()} applications.`}
      section="applications"
      applicationType={application.type}
      applicationRedirectTo={`/csr/applications/${application.slug}`}
    />
  )
}
