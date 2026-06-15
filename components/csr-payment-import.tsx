"use client"

import { useState } from "react"
import { AlertCircle, Download, FileSpreadsheet, LoaderCircle, Upload, X } from "lucide-react"
import { BOTSWANA_COUNCILS } from "@/lib/botswana-locations"

type ImportReport = {
  fileName: string
  counts: { paid: number; unmatched: number; duplicate: number; invalid: number; warnings: number }
  rows: Array<{
    row: number
    name: string
    nationalId: string
    paymentMonth: string
    amount: number | null
    status: string
    message: string
    warning?: string
  }>
}

export function CsrPaymentImport() {
  const [report, setReport] = useState<ImportReport | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)
  const [templateError, setTemplateError] = useState("")
  const [council, setCouncil] = useState("Gaborone City Council")
  const [paymentMonth, setPaymentMonth] = useState(new Date().toISOString().slice(0, 7))

  async function downloadTemplate() {
    setDownloadingTemplate(true)
    setTemplateError("")

    try {
      const response = await fetch(
        `/api/csr/payments/template?council=${encodeURIComponent(council)}&paymentMonth=${encodeURIComponent(paymentMonth)}`,
      )

      if (!response.ok) {
        const message = (await response.text()).trim()
        throw new Error(message || "The council payment template could not be generated.")
      }

      const blob = await response.blob()
      const disposition = response.headers.get("Content-Disposition") ?? ""
      const fileName = disposition.match(/filename="([^"]+)"/)?.[1] ?? "bonu-council-payments.xlsx"
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (downloadError) {
      setTemplateError(
        downloadError instanceof Error
          ? downloadError.message
          : "The council payment template could not be generated. Please try again.",
      )
    } finally {
      setDownloadingTemplate(false)
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    setLoading(true)
    setError("")
    setReport(null)

    try {
      const response = await fetch("/api/csr/payments/import", {
        method: "POST",
        body: formData,
      })
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "The payment file could not be processed.")
        return
      }

      setReport(result)
    } catch {
      setError("The payment file could not be processed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mb-6 rounded-lg border bg-white p-5 shadow-sm">
      <div>
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Bulk monthly payments</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Upload CSV or Excel rows matched by National ID / Omang. The expected membership fee is 5% of each member's monthly salary.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-lg border bg-muted/30 p-4">
        <h3 className="font-bold">Generate council payment template</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          The file includes profiled members whose membership application is approved or fulfilled, and prefills the membership fee calculated as 5% of monthly salary.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_13rem_auto] md:items-end">
          <label className="block">
            <span className="text-sm font-semibold">Council</span>
            <select className="mt-2 min-h-11 w-full rounded-md border bg-white px-3 py-2" value={council} onChange={(event) => setCouncil(event.target.value)}>
              {BOTSWANA_COUNCILS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Payment month</span>
            <input className="mt-2 min-h-11 w-full rounded-md border bg-white px-3 py-2" type="month" value={paymentMonth} onChange={(event) => setPaymentMonth(event.target.value)} />
          </label>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border bg-white px-4 py-2.5 text-sm font-semibold text-primary hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            disabled={downloadingTemplate}
            onClick={downloadTemplate}
            type="button"
          >
            {downloadingTemplate ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {downloadingTemplate ? "Generating template..." : "Download populated template"}
          </button>
        </div>
      </div>

      <form
        aria-busy={loading}
        className="mt-5 flex flex-col gap-3 rounded-lg border border-dashed bg-muted/30 p-4 sm:flex-row sm:items-end"
        data-client-submit="true"
        onSubmit={submit}
      >
        <label className="min-w-0 flex-1">
          <span className="text-sm font-semibold">Payment file</span>
          <input
            className="mt-2 block min-h-11 w-full rounded-md border bg-white px-3 py-2 text-sm"
            accept=".csv,.xls,.xlsx"
            name="file"
            required
            type="file"
          />
        </label>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 font-semibold text-primary-foreground disabled:opacity-50"
          disabled={loading}
          type="submit"
        >
          <Upload className="h-4 w-4" />
          {loading ? "Processing..." : "Upload payments"}
        </button>
      </form>

      {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800" role="alert">{error}</p>}

      {templateError && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          role="alertdialog"
          aria-labelledby="template-error-title"
          aria-describedby="template-error-description"
          aria-modal="true"
        >
          <div className="flex min-h-40 w-full max-w-2xl items-start gap-4 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-950 shadow-2xl sm:p-8">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-700" />
            </span>
            <div className="min-w-0 flex-1">
              <p id="template-error-title" className="text-xl font-bold">Template download failed</p>
              <p id="template-error-description" className="mt-3 text-base leading-7">{templateError}</p>
            </div>
            <button
              aria-label="Close error message"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-red-800 hover:bg-red-100"
              onClick={() => setTemplateError("")}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {report && (
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <ReportMetric label="Paid" value={report.counts.paid} tone="success" />
            <ReportMetric label="Unmatched" value={report.counts.unmatched} tone="warning" />
            <ReportMetric label="Duplicates" value={report.counts.duplicate} tone="neutral" />
            <ReportMetric label="Invalid" value={report.counts.invalid} tone="danger" />
            <ReportMetric label="Warnings" value={report.counts.warnings} tone="warning" />
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Row</th>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">National ID</th>
                  <th className="px-4 py-3">Month</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Result</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row) => (
                  <tr key={`${row.row}-${row.nationalId}`} className="border-t align-top">
                    <td className="px-4 py-3">{row.row}</td>
                    <td className="px-4 py-3 font-semibold">{row.name || "Not supplied"}</td>
                    <td className="px-4 py-3">{row.nationalId}</td>
                    <td className="px-4 py-3">{row.paymentMonth?.slice(0, 7)}</td>
                    <td className="px-4 py-3">{row.amount == null ? "-" : `P ${row.amount.toFixed(2)}`}</td>
                    <td className="px-4 py-3 capitalize">{row.status}</td>
                    <td className="px-4 py-3">
                      <p>{row.message}</p>
                      {row.warning && <p className="mt-1 text-xs font-medium text-amber-700">{row.warning}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}

function ReportMetric({ label, value, tone }: { label: string; value: number; tone: "success" | "warning" | "danger" | "neutral" }) {
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    danger: "border-red-200 bg-red-50 text-red-800",
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
  }
  return <div className={`rounded-lg border p-4 ${styles[tone]}`}><p className="text-sm font-semibold">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>
}
