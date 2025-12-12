'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { BookIcon, Brain, CheckCheck, Heart, Joystick, NotebookPen, Puzzle, Tv, Sparkles, Star } from 'lucide-react';
import ActivityBar from '@/components/ActivityBar';

export default function Home() {
  const { resolvedTheme } = useTheme();
  const [isDark, setIsDark] = useState(true);

  // apply theme to <html>
  useEffect(() => {
    setIsDark(resolvedTheme === 'dark');
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

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950/50">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Helper Hero Section */}
        <div className="relative mb-12 p-8 rounded-3xl bg-[url('/icons/cabocil-cover-light-min.png')] bg-cover bg-center bg-no-repeat dark:bg-[url('/icons/cabocil-cover-night-min.png')] overflow-hidden shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 uppercase tracking-wider text-sm font-bold">
                <Sparkles size={16} />
                <span>Selamat Datang</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight">
                Halo, Petualang Kecil! 👋
              </h1>
              <p className="text-lg max-w-md">
                Siap untuk belajar dan bermain hari ini? Ayo pilih kegiatan favoritmu!
              </p>
            </div>
          </div>

          {/* Decorative circles */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-black/10 blur-3xl" />
        </div>

        <div className='mb-12'>
          <ActivityBar />
        </div>

        {/* Menu Cards */}
        <div className='mb-16'>
          <div className='flex flex-col md:flex-row justify-between items-center mb-6'>
            <div className='flex items-center gap-3'>
              <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                <Star size={24} />
              </div>
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Pilih Petualanganmu
              </span>
            </div>

            <Link href="/subscription/package">
              <button
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-2xl font-medium inline-flex items-center transition-all duration-300 gap-1"
              >
                <Sparkles className="w-5 h-5" />
                Mulai Berlangganan
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MenuCard
              href="/tv"
              label="TV Anak"
              icon={<Tv size={32} />}
              gradient="from-pink-500 to-rose-500"
              shadowColor="shadow-rose-500/20"
              blurb="Nonton kartun seru!"
              isDark={isDark}
            />

            <MenuCard
              href="/books"
              label="Buku Cerita"
              icon={<BookIcon size={32} />}
              gradient="from-cyan-500 to-blue-500"
              shadowColor="shadow-blue-500/20"
              blurb="Baca kisah ajaib."
              isDark={isDark}
            />

            <MenuCard
              href="/workbooks"
              label="Lembar Kerja"
              icon={<NotebookPen size={32} />}
              gradient="from-violet-500 to-purple-500"
              shadowColor="shadow-purple-500/20"
              blurb="Belajar menulis & hitung."
              isDark={isDark}
            />

            <MenuCard
              href="/games"
              label="Permainan"
              icon={<Joystick size={32} />}
              gradient="from-amber-400 to-orange-500"
              shadowColor="shadow-orange-500/20"
              blurb="Main game asah otak."
              isDark={isDark}
            />
          </div>
        </div>

        <footer className="flex flex-col items-center justify-center gap-2 text-sm py-8 border-t border-slate-200 dark:border-slate-800/50">
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

function MenuCard({ href, label, icon, gradient, shadowColor, blurb, isDark }) {
  return (
    <Link href={href} className="group relative block h-full">
      <div className={`relative h-full overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${shadowColor}`}>
        {/* Background Gradient Blob */}
        <div className={`absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-3xl transition-all group-hover:opacity-20`} />

        <div className="relative z-10 flex flex-col items-start h-full space-y-4">
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-800 group-hover:to-slate-600 dark:group-hover:from-white dark:group-hover:to-slate-300">
              {label}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {blurb}
            </p>
          </div>

          <div className="mt-auto pt-2 flex items-center text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
            Mulai sekarang <span className="ml-1 text-lg leading-none">&rarr;</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
