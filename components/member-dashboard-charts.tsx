"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type ChartItem = {
  name: string
  value: number
}

const colors = ["#078ba4", "#f28b2f", "#15966a", "#4178a8", "#cf5d55", "#58aeb9"]

export function MemberDashboardCharts({
  deductions,
  applications,
  payments,
}: {
  deductions: ChartItem[]
  applications: ChartItem[]
  payments: ChartItem[]
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-3">
      <ChartCard title="Monthly deduction allocation">
        {deductions.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={deductions} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={2}>
                {deductions.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, "Allocation"]} />
              <Legend
                iconType="circle"
                formatter={(value, entry) => {
                  const percentage = Number((entry.payload as ChartItem | undefined)?.value ?? 0)
                  return `${value} (${percentage.toFixed(1)}%)`
                }}
                wrapperStyle={{ fontSize: 12, lineHeight: "20px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart text="No active monthly deductions yet." />
        )}
      </ChartCard>

      <ChartCard title="Applications by status">
        {applications.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={applications}>
              <CartesianGrid stroke="#d7e8eb" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#078ba4" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart text="No applications submitted yet." />
        )}
      </ChartCard>

      <ChartCard title="Payments by status">
        {payments.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={payments}>
              <CartesianGrid stroke="#d7e8eb" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(value) => [`P ${Number(value).toFixed(2)}`, "Amount"]} />
              <Bar dataKey="value" fill="#f28b2f" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart text="No payment records yet." />
        )}
      </ChartCard>
    </section>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="rounded-lg border bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </article>
  )
}

function EmptyChart({ text }: { text: string }) {
  return <div className="grid h-64 place-items-center rounded-md bg-muted text-sm font-medium text-muted-foreground">{text}</div>
}
