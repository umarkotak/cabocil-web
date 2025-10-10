'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PlayCircle, BookOpen, RefreshCw, Clock, GalleryHorizontalEnd } from 'lucide-react'
import cabocilAPI from '@/apis/cabocil_api'
import { toast } from 'react-toastify'
import { useTheme } from 'next-themes'

/**
 * Modernized Activities Page
 * - Polished visuals: rounded-2xl cards, subtle borders & shadows, hover lift
 * - Unified ActivityCard for video/book with icons & overlays
 * - Robust loading skeletons & empty state
 * - Safer image fallbacks & defensive metadata handling
 * - Accessible labels & keyboard-friendly buttons/links
 */

const FALLBACK_THUMB = '/placeholder-video.jpg'

const percentFrom = (current = 0, max = 0) => {
  if (!max) return 100
  const pct = Math.min(Math.max((current / max) * 100, 0), 100)
  return Number.isFinite(pct) ? Math.round(pct) : 0
}

const progressLabel = (current = 0, max = 0) => {
  if (!max) return 'Completed'
  return `${current}/${max}`
}

function MediaThumb({ src, title, icon, redir }) {
  return (
    <Link href={redir || "#"}>
      <div className="relative w-24 h-16 sm:w-28 sm:h-20 rounded-xl overflow-hidden ring-1 ring-black/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src || FALLBACK_THUMB}
          alt={title || 'media thumbnail'}
          className="group-hover:scale-105 transition-transform w-full h-full object-contain bg-muted"
          onError={(e) => {
            // @ts-ignore – HTMLImageElement target
            e.currentTarget.src = FALLBACK_THUMB
          }}
          />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-black/0 to-black/0" />
        {/* <div className="absolute inset-0 flex items-center justify-center">
          {icon}
        </div> */}
      </div>
    </Link>
  )
}

function VideoCard({ activity }) {
  const router = useRouter()
  const data = activity?.video || {}
  const current = activity?.metadata?.current_progress ?? 0
  const max = activity?.metadata?.max_progress ?? 0
  const pct = percentFrom(current, max)
  const title = data?.title || 'Untitled'
  const redirect = data?.redirect_path

  return (
    <Link href={redirect} className='flex-none shadow-md rounded border border-accent overflow-hidden group hover:border-primary'>
      <div className={`w-[220px] h-[100px]`}>
        <div className="flex flex-row gap-2 h-full">
          <div className="relative flex-none">
            <img
              className={`flex-none object-contain bg-zinc-100 dark:bg-zinc-900 h-full w-[100px]`}
              src={data?.image_url}
              alt="thumb"
            />
            {/* {props.show_last_access && <div className="absolute bottom-0 w-full bg-black bg-opacity-50 text-[10px] p-0.5">
              {utils.GetTimeElapsed(props.anime.last_watch_at)}
            </div>} */}
          </div>
          <div className="flex flex-col justify-between">
            <p className="text-xs leading-1 line-clamp-2">{title}</p>

            <div className="flex flex-col pb-4">
              <span className='text-xs'>{pct}%</span>
              <span className='text-xs'>lanjut nonton</span>
            </div>
          </div>
        </div>
      </div>
      <Progress value={pct} className="h-1 rounded-none" />
    </Link>
  )
}

function BookCard({ activity }) {
  const router = useRouter()
  const data = activity?.book || {}
  const current = activity?.metadata?.current_progress ?? 0
  const max = activity?.metadata?.max_progress ?? 0
  const pct = percentFrom(current, max)
  const title = data?.title || `Book ${activity?.book_id ?? ''}`
  const redirect = data?.redirect_path || "#"

  return (
    <Link href={redirect} className='flex-none shadow-md rounded border border-accent overflow-hidden group hover:border-primary'>
      <div className={`w-[220px] h-[100px]`}>
        <div className="flex flex-row gap-2 h-full">
          <div className="relative flex-none">
            <img
              className={`flex-none object-contain bg-zinc-100 dark:bg-zinc-900 h-full w-[100px]`}
              src={data?.image_url}
              alt="thumb"
            />
            {/* {props.show_last_access && <div className="absolute bottom-0 w-full bg-black bg-opacity-50 text-[10px] p-0.5">
              {utils.GetTimeElapsed(props.anime.last_watch_at)}
            </div>} */}
          </div>
          <div className="flex flex-col justify-between">
            <p className="text-xs leading-1 line-clamp-2">{title}</p>

            <div className="flex flex-col pb-4">
              <span className='text-xs'>{progressLabel(current, max)}</span>
              <span className='text-xs'>lanjut baca</span>
            </div>
          </div>
        </div>
      </div>
      <Progress value={pct} className="h-1 rounded-none" />
    </Link>
  )
}

export default function ActivityBar() {
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

  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchActivities = useCallback(async () => {
    if (cabocilAPI.GenAuthToken() === "") { return }

    try {
      setLoading((prev) => prev && true)
      setRefreshing((prev) => !prev && !loading ? true : prev)
      const response = await cabocilAPI.GetUserActivity('', {}, {
        limit: 20,
      })

      if (!response?.ok) throw new Error('Failed to fetch activities')

      const payload = await response.json()
      const list = payload?.data?.activities || []
      setActivities(Array.isArray(list) ? list : [])
    } catch (err) {
      toast.error(err?.message || 'Something went wrong')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [loading])

  useEffect(() => {
    fetchActivities()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasItems = activities?.length > 0

  return (
    <div className=''>
      <div className='flex justify-between items-center mb-3'>
        <span className={`text-2xl flex items-center gap-2`}>
          <GalleryHorizontalEnd />
          Aktivitas Ku
        </span>
        <Link href="/activity">
          <Button size="sm" variant="outline">semua aktivitas</Button>
        </Link>
      </div>

      <div className="w-full flex items-center gap-4 overflow-auto py-2">
        {loading ? (
          <div>sedang memuat...</div>
        ) : hasItems ? (
          <>
            {activities.map((activity, idx) => {
              const key =
                activity?.id ||
                `${activity?.activity_type || 'item'}-${activity?.youtube_video_id || 'y'}-${activity?.book_id || 'b'}-${idx}`
              return (activity?.activity_type === 'video' ? (
                <VideoCard key={key} activity={activity} />
              ) : (
                <BookCard key={key} activity={activity} />
              ))
            })}
          </>
        ) : (
          <div>mulai lakukan aktivitas</div>
        )}
      </div>
    </div>
  )
}
