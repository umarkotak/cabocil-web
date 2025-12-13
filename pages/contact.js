'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Mail, Youtube, Instagram, Heart, ArrowLeft, Send, MessageCircle } from 'lucide-react';

// X (Twitter) icon component
const XIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// TikTok icon component
const TikTokIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

export default function Contact() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (resolvedTheme === 'dark') {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else if (resolvedTheme === 'light') {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [resolvedTheme])

  const contactLinks = [
    {
      name: 'Email',
      handle: 'cabocilcs@gmail.com',
      href: 'mailto:cabocilcs@gmail.com',
      icon: <Mail size={28} />,
      gradient: 'from-red-500 to-orange-500',
      shadowColor: 'shadow-orange-500/20',
      description: 'Kirim pesan langsung',
    },
    {
      name: 'YouTube',
      handle: '@cabocil',
      href: 'https://www.youtube.com/@cabocil',
      icon: <Youtube size={28} />,
      gradient: 'from-red-600 to-red-500',
      shadowColor: 'shadow-red-500/20',
      description: 'Tonton video seru',
    },
    {
      name: 'X (Twitter)',
      handle: '@cabocilcs',
      href: 'https://x.com/cabocilcs',
      icon: <XIcon size={28} />,
      gradient: 'from-slate-800 to-slate-600',
      shadowColor: 'shadow-slate-500/20',
      description: 'Update terbaru',
    },
    {
      name: 'Instagram',
      handle: '@cabocilcs',
      href: 'https://instagram.com/cabocilcs',
      icon: <Instagram size={28} />,
      gradient: 'from-purple-600 via-pink-500 to-orange-400',
      shadowColor: 'shadow-pink-500/20',
      description: 'Lihat foto & story',
    },
    {
      name: 'TikTok',
      handle: '@cabocilcs',
      href: 'https://tiktok.com/@cabocilcs',
      icon: <TikTokIcon size={28} />,
      gradient: 'from-slate-900 via-pink-500 to-cyan-400',
      shadowColor: 'shadow-pink-500/20',
      description: 'Video pendek kreatif',
    },
  ];

  return (
    <div className="">
      <div className="w-full max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Kembali ke Beranda</span>
        </Link>

        {/* Hero Section */}
        <div className="relative mb-12 p-8 rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 overflow-hidden shadow-2xl">
          <div className="relative z-10 text-center text-white">
            <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4">
              <MessageCircle size={18} />
              <span className="text-sm font-semibold uppercase tracking-wider">Hubungi Kami</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Halo! 👋 Ada yang Bisa Kami Bantu?
            </h1>
            <p className="text-lg text-white/90 max-w-xl mx-auto">
              Kami senang mendengar dari kamu! Hubungi kami melalui platform favoritmu.
            </p>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-black/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {contactLinks.map((contact) => (
            <a
              key={contact.name}
              href={contact.href}
              target={contact.name !== 'Email' ? '_blank' : undefined}
              rel={contact.name !== 'Email' ? 'noopener noreferrer' : undefined}
              className="group relative block"
            >
              <div className={`relative h-full overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${contact.shadowColor}`}>
                {/* Background Gradient Blob */}
                <div className={`absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${contact.gradient} opacity-10 blur-2xl transition-all group-hover:opacity-25`} />

                <div className="relative z-10 flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${contact.gradient} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {contact.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                      {contact.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium truncate">
                      {contact.handle}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {contact.description}
                    </p>
                  </div>

                  <Send size={18} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Additional Message */}
        <div className="text-center p-6 rounded-2xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            📬 Biasanya kami membalas dalam waktu 1-2 hari kerja.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            Terima kasih sudah menjadi bagian dari keluarga CaBocil!
          </p>
        </div>

        {/* Footer */}
        <footer className="flex flex-col items-center justify-center gap-2 text-sm py-8 mt-8 border-t border-slate-200 dark:border-slate-800/50">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Dibuat dengan</span>
            <Heart className='text-red-500 fill-red-500 animate-pulse' size={16} />
            <span className="text-slate-500">untuk anak-anak Indonesia</span>
          </div>
          <p className="text-slate-400 text-xs">Versi 1.0.0 • CaBocil Web</p>
        </footer>
      </div>
    </div>
  )
}
