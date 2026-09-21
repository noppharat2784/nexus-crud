import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { PRODUCT_COLORS, STATUS_COLORS } from './chartTokens.js'

function TooltipCard({ active, label, payload, unit = 'units' }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      {label ? <p className="mb-1 text-xs font-semibold text-slate-500">{label}</p> : null}
      {payload.map((item) => (
        <div className="flex items-center justify-between gap-4 text-sm" key={item.dataKey || item.name}>
          <span className="flex items-center gap-2 text-slate-600">
            <span className="size-2 rounded-full" style={{ backgroundColor: item.color || item.payload?.fill }} />
            {item.name}
          </span>
          <span className="font-bold text-slate-950">{Number(item.value).toLocaleString()} {unit}</span>
        </div>
      ))}
    </div>
  )
}

const nonZeroLabel = (value) => (value > 0 ? value.toLocaleString() : '')

export function StockDistributionPie({ data }) {
  return (
    <div aria-label="Pie chart showing Nexus stock distribution by tenant" className="h-80 w-full" role="img">
      <ResponsiveContainer height="100%" width="100%">
        <PieChart accessibilityLayer>
          <Pie data={data} dataKey="stock" innerRadius={0} isAnimationActive={false} label={({ stock }) => nonZeroLabel(stock)} labelLine={false} nameKey="tenant_name" outerRadius="78%" stroke="#ffffff" strokeWidth={2}>
            {data.map((item) => <Cell fill={item.color} key={item.tenant_id} />)}
          </Pie>
          <Tooltip content={<TooltipCard />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ProductStockBarChart({ data }) {
  const chartWidth = data.length > 4 ? data.length * 112 : '100%'

  return (
    <div aria-label="Bar chart showing product stock for the selected tenant" className="overflow-x-auto" role="img">
      <div className="h-80" style={{ minWidth: chartWidth }}>
        <ResponsiveContainer height="100%" width="100%">
          <BarChart accessibilityLayer data={data} margin={{ top: 24, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis axisLine={{ stroke: '#cbd5e1' }} dataKey="product_name" tick={{ fill: '#475569', fontSize: 12 }} tickLine={false} />
            <YAxis allowDecimals={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} width={38} />
            <Tooltip content={<TooltipCard />} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="stock" isAnimationActive={false} name="Stock" radius={[6, 6, 0, 0]}>
              {data.map((item, index) => <Cell fill={PRODUCT_COLORS[index % PRODUCT_COLORS.length]} key={item.product_id} />)}
              <LabelList dataKey="stock" fill="#0f172a" fontSize={12} fontWeight={700} formatter={nonZeroLabel} position="top" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function ReservationStatusDonut({ data, total }) {
  return (
    <div aria-label="Donut chart showing Nexus reservation quantities by status" className="h-80 w-full" role="img">
      <ResponsiveContainer height="100%" width="100%">
        <PieChart accessibilityLayer>
          <Pie data={data} dataKey="quantity" innerRadius="52%" isAnimationActive={false} nameKey="status" outerRadius="78%" stroke="#ffffff" strokeWidth={2}>
            {data.map((item) => <Cell fill={STATUS_COLORS[item.status]} key={item.status} />)}
          </Pie>
          <text fill="#0f172a" fontSize="30" fontWeight="700" textAnchor="middle" x="50%" y="48%">{total.toLocaleString()}</text>
          <text fill="#64748b" fontSize="13" fontWeight="600" textAnchor="middle" x="50%" y="56%">units</text>
          <Tooltip content={<TooltipCard />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function TenantStatusBarChart({ data }) {
  const chartHeight = Math.max(270, data.length * 62 + 100)

  return (
    <div aria-label="Horizontal stacked bar chart showing reservation quantities by tenant and status" className="overflow-x-auto" role="img">
      <div style={{ height: chartHeight, minWidth: data.length > 4 ? 520 : '100%' }}>
        <ResponsiveContainer height="100%" width="100%">
          <BarChart accessibilityLayer data={data} layout="vertical" margin={{ top: 14, right: 24, bottom: 20, left: 12 }}>
            <CartesianGrid horizontal={false} stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis allowDecimals={false} axisLine={{ stroke: '#cbd5e1' }} tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} type="number" />
            <YAxis axisLine={false} dataKey="tenant_name" tick={{ fill: '#334155', fontSize: 12 }} tickLine={false} type="category" width={104} />
            <Tooltip content={<TooltipCard />} cursor={{ fill: '#f8fafc' }} />
            {Object.entries(STATUS_COLORS).map(([status, color], index) => (
              <Bar dataKey={status} fill={color} isAnimationActive={false} key={status} name={status} radius={index === 2 ? [0, 5, 5, 0] : 0} stackId="reservation-status">
                <LabelList dataKey={status} fill="#ffffff" fontSize={12} fontWeight={700} formatter={nonZeroLabel} position="center" />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
