"use client"
import React from "react"
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  ListChecks
} from "lucide-react"

// ------------------
// Helpers
// ------------------
function formatInTZ(date, timeZone, locale = "id-ID") {
  if (!date) return "—"
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "full",
      timeStyle: "short",
      timeZone
    }).format(date)
  } catch {
    // Fallback without TZ if an invalid timeZone was passed
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "full",
      timeStyle: "short"
    }).format(date)
  }
}

function ceilDiffDays(from, to) {
  const ms = to.getTime() - from.getTime()
  const dayMs = 24 * 60 * 60 * 1000
  return Math.ceil(ms / dayMs)
}

// ------------------
// UI Primitives
// ------------------
function Stat({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-sm">
      <div className="rounded-xl border p-2">{icon}</div>
      <div>
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-lg font-semibold leading-snug">{value}</div>
      </div>
    </div>
  )
}

// ------------------
// Main Component
// ------------------
export default function SubscriptionCard({
  subscription,
  timeZone = "Asia/Jakarta",
  locale = "id-ID"
}) {
  // Demo fallback so the component renders nicely without props
  const fallback = {
    data: {
      active: true,
      ended_at: "2026-02-22T09:21:36.316452+07:00",
      remaining_day: 181,
      active_subscriptions: [
        {
          started_at: "2025-08-25T09:21:36.316452+07:00",
          ended_at: "2026-02-22T09:21:36.316452+07:00"
        }
      ]
    },
    success: true,
    error: {}
  }

  const payload = subscription ?? fallback
  const endISO =
    payload?.data?.ended_at ??
    payload?.data?.active_subscriptions?.[0]?.ended_at ??
    null
  const endDate = endISO ? new Date(endISO) : null

  const now = new Date()
  const daysLeftCalc = endDate ? Math.max(0, ceilDiffDays(now, endDate)) : 0
  const daysLeft =
    typeof payload?.data?.remaining_day === "number" &&
    payload.data.remaining_day !== null
      ? Math.max(0, payload.data.remaining_day)
      : daysLeftCalc

  const isExpired = endDate
    ? endDate.getTime() <= now.getTime() || daysLeft <= 0
    : !payload?.data?.active
  const isActive = !isExpired && !!payload?.data?.active

  return (
    <section className="mx-auto w-full max-w-2xl rounded-3xl border bg-gradient-to-b from-white to-slate-50 p-6 shadow">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Status Langganan</h2>
        <span
          className={[
            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm",
            isActive
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
              : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
          ].join(" ")}
        >
          {isActive ? (
            <>
              <CheckCircle2 className="size-4" /> Aktif
            </>
          ) : (
            <>
              <XCircle className="size-4" /> Kedaluwarsa
            </>
          )}
        </span>
      </div>

      {/* Stats */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Stat
          icon={<Calendar className="size-5" />}
          label="Aktif sampai"
          value={formatInTZ(endDate, timeZone, locale)}
        />
        <Stat
          icon={<Clock className="size-5" />}
          label="Sisa hari"
          value={`${daysLeft} hari`}
        />
      </div>

      {/* Details */}
      <div className="mt-6 rounded-2xl border bg-white p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-600">
          <ListChecks className="size-4" /> Periode Langganan Aktif
        </div>
        {payload?.data?.active_subscriptions?.length ? (
          <ul className="space-y-2 text-sm">
            {payload.data.active_subscriptions.map((s, idx) => {
              const sStart = new Date(s.started_at)
              const sEnd = new Date(s.ended_at)
              return (
                <li
                  key={idx}
                  className="flex flex-wrap items-center gap-2 text-gray-700"
                >
                  <span className="rounded-md bg-slate-50 px-2 py-1 ring-1 ring-slate-200">
                    {formatInTZ(sStart, timeZone, locale)}
                  </span>
                  <span>—</span>
                  <span className="rounded-md bg-slate-50 px-2 py-1 ring-1 ring-slate-200">
                    {formatInTZ(sEnd, timeZone, locale)}
                  </span>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">
            Tidak ada periode aktif yang tercatat.
          </p>
        )}
      </div>

      {/* Error / Debug */}
      {!payload.success && (
        <p className="mt-4 text-sm text-rose-600">
          Terjadi kesalahan memuat langganan. Silakan coba lagi.
        </p>
      )}

      {/* Usage hint (commented) */}
      {/*
        Cara pakai:

        import SubscriptionStatus from '@/components/SubscriptionStatus'

        export default function Page() {
          const data: SubscriptionPayload = YOUR_JSON
          return <SubscriptionStatus subscription={data} timeZone="Asia/Jakarta" />
        }
      */}
    </section>
  )
}
