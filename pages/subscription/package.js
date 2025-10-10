// app/purchase/page.tsx
"use client"
import { use, useEffect, useMemo, useState } from "react"
import Script from "next/script"
import { Check, Sparkles, Book, Video, FileText, X } from "lucide-react"
import cabocilAPI from "@/apis/cabocil_api"
import { toast } from "react-toastify"
import { useRouter } from "next/router"

const BENEFITS = [
  { icon: Video, text: "Unlimited video access", color: "text-purple-600" },
  { icon: Book, text: "Unlimited book access", color: "text-blue-600" },
  { icon: FileText, text: "Unlimited workbook access", color: "text-green-600" }
]

// Custom Modal Component
function ConfirmationModal({ isOpen, onClose, onConfirm, product }) {
  if (!isOpen) return null

  const hasDiscount = product?.base_price > product?.price
  const currency = n =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(n)
  const discountPct = hasDiscount
    ? Math.round(
        ((product.base_price - product.price) / product.base_price) * 100
      )
    : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-md mx-4 border border-slate-200 dark:border-slate-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          <h3 className="text-xl font-semibold mb-2">Konfirmasi Pembelian</h3>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            Yakin ingin membeli paket{" "}
            <span className="font-semibold text-purple-600">
              {product?.name}
            </span>
            ?
          </p>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Total Harga:
              </span>

              <div className="text-right">
                {hasDiscount && (
                  <div className="flex items-center justify-end gap-2">
                    <span className="line-through text-slate-400 text-sm">
                      {currency(product.base_price)}
                    </span>
                    <span className="text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-2 py-0.5 rounded-full">
                      -{discountPct}%
                    </span>
                  </div>
                )}
                <div className="text-2xl font-bold text-purple-600">
                  {product && currency(product.price)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-colors font-medium"
            >
              Lanjut Bayar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PurchasePage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyCode, setBusyCode] = useState(null)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    product: null
  })
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await cabocilAPI.GetProducts("", {}, {})
        if (!res.ok) throw new Error(`Failed: ${res.status}`)
        const json = await res.json()
        if (!json.success) throw new Error("API returned success=false")
        setProducts(json.data || [])
      } catch (e) {
        setError(e?.message || "Failed to load products")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const formattedProducts = useMemo(
    () =>
      products.map(p => {
        const priceFmt = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0
        })
        const hasDiscount =
          typeof p.base_price === "number" &&
          typeof p.price === "number" &&
          p.base_price > p.price
        const discountPct = hasDiscount
          ? Math.round(((p.base_price - p.price) / p.base_price) * 100)
          : 0
        return {
          ...p,
          durationLabel: p.metadata?.duration_days
            ? `${p.metadata.duration_days} hari`
            : undefined,
          priceLabel: priceFmt.format(p.price),
          basePriceLabel:
            typeof p.base_price === "number"
              ? priceFmt.format(p.base_price)
              : undefined,
          hasDiscount,
          discountPct
        }
      }),
    [products]
  )

  const handleBuy = product => {
    setConfirmModal({ isOpen: true, product })
  }

  const confirmPurchase = async () => {
    const product = confirmModal.product
    if (!product || busyCode) return

    setConfirmModal({ isOpen: false, product: null })

    try {
      setBusyCode(product.code)
      const res = await cabocilAPI.PostCreateOrder(
        "",
        {},
        {
          product_code: product.code
        }
      )

      if (res.status === 401) {
        router.push("/sign_in")
        return
      }

      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`Order failed: ${res.status} ${txt}`)
      }

      const json = await res.json()
      // MODIFIED: Check for the payment URL instead of the Snap token
      if (!json.success || !json.data?.midtrans_snap_url) {
        throw new Error("Order API did not return a payment URL")
      }

      const order = json.data

      // MODIFIED: Open the payment URL in a new tab
      window.open(order.midtrans_snap_url, "_blank")
      // alert(
      //   "Halaman pembayaran telah dibuka di tab baru. Silakan selesaikan pembayaran Anda di sana. ✅"
      // )
      router.push("/subscription")

    } catch (e) {
      console.error(e)
      toast.error(e?.message || "Gagal membuat order")
    } finally {
      setBusyCode(null)
    }
  }

  return (
    <main className="h-[calc(100vh-70px)] bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-950 dark:via-slate-950 dark:to-orange-950 text-slate-900 dark:text-slate-100">
      {/* Midtrans Snap Script (Optional, can be removed if not using Snap token anywhere else) */}
      <Script
        id="midtrans-snap"
        src={cabocilAPI.SnapJSUrl}
        data-client-key={cabocilAPI.SnapClientKey}
        strategy="afterInteractive"
      />

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="flex justify-center items-center gap-2 text-2xl font-bold tracking-tight mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
            Pilih Paket Berlangganan Akses Premium
          </h1>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3 text-slate-500 dark:text-slate-400">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              Memuat paket berlangganan yang menarik untuk kamu...
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-6 py-4 rounded-2xl">
              <X className="w-5 h-5" />
              Gagal memuat produk: {error}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {formattedProducts.map((p, index) => (
            <div
              key={p.code}
              className={`group relative overflow-hidden rounded-3xl border-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 ${
                index === 1
                  ? "border-purple-200 dark:border-purple-800 ring-2 ring-purple-500/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-800"
              }`}
            >
              {/* Popular Badge */}
              {index === 1 && (
                <div className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-bl-2xl rounded-tr-3xl text-sm font-medium">
                  🔥 Popular
                </div>
              )}

              <div className="p-8">
                {/* Header */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{p.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    {p.durationLabel || p.benefit_type}
                  </p>
                </div>

                {/* Price with strike-through + discount */}
                <div className="text-center mb-8">
                  {p.hasDiscount && (
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="line-through text-slate-400 text-sm">
                        {p.basePriceLabel}
                      </span>
                      <span className="text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-2 py-0.5 rounded-full">
                        -{p.discountPct}%
                      </span>
                    </div>
                  )}
                  <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {p.priceLabel}
                  </span>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {BENEFITS.map((benefit, benefitIndex) => (
                    <div key={benefitIndex} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm">{benefit.text}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleBuy(p)}
                  disabled={busyCode === p.code}
                  className={`w-full relative overflow-hidden rounded-2xl px-6 py-4 text-sm font-semibold transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed ${
                    index === 1
                      ? "bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 shadow-lg hover:shadow-xl"
                      : "bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-900 dark:text-slate-100 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/50 dark:hover:to-pink-900/50"
                  }`}
                >
                  <span className="relative z-10">
                    {busyCode === p.code ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        Memproses...
                      </span>
                    ) : (
                      "🚀 Mulai Sekarang"
                    )}
                  </span>
                </button>

                {/* Product Code */}
                <div className="mt-4 text-center text-xs text-slate-400">
                  Kode:{" "}
                  <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    {p.code}
                  </span>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl group-hover:from-purple-400/30 group-hover:to-pink-400/30 transition-all duration-300"></div>
              <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-gradient-to-br from-orange-400/20 to-yellow-400/20 rounded-full blur-xl group-hover:from-orange-400/30 group-hover:to-yellow-400/30 transition-all duration-300"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, product: null })}
        onConfirm={confirmPurchase}
        product={confirmModal.product}
      />
    </main>
  )
}
