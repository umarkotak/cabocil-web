import { useState, useEffect, useCallback, useRef } from 'react'

import ChannelList from '@/components/ChannelList'
import VideoCard from '@/components/VideoCard'

import cabocilAPI from '@/apis/cabocil_api'
import Utils from '@/models/Utils'
import { useSearchParams } from 'next/navigation'
import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  const [videoList, setVideoList] = useState([])
  const [channelList, setChannelList] = useState([])
  const [videoIDs, setVideoIDs] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const searchParams = useSearchParams()
  const isInitialLoad = useRef(true)

  // Reset state when search params change
  useEffect(() => {
    setVideoList([])
    setVideoIDs([])
    setPage(1)
    setLoading(false)
    setHasMore(true)
    isInitialLoad.current = true

    // Load initial data
    loadMoreVideos(1, [])
    GetChannelList({})
  }, [searchParams])

  const loadMoreVideos = useCallback(async (currentPage, currentVideoIDs) => {
    if (loading || !hasMore) {
      return
    }

    try {
      setLoading(true)

      const response = await cabocilAPI.GetVideos("", {}, {
        page: currentPage,
        exclude_ids: currentVideoIDs.join(","),
        sort: "random",
      })

      const body = await response.json()

      if (response.status !== 200) {
        setLoading(false)
        return
      }

      const newVideos = body.data.videos || []

      // If no new videos, we've reached the end
      if (newVideos.length === 0) {
        setHasMore(false)
        setLoading(false)
        return
      }

      const newVideoIDs = newVideos.map(video => video.id)

      setVideoList(prev => [...prev, ...newVideos])
      setVideoIDs(prev => [...prev, ...newVideoIDs])
      setPage(currentPage + 1)
      setLoading(false)

    } catch (e) {
      console.error('Error loading videos:', e)
      setLoading(false)
    }
  }, [loading, hasMore])

  async function GetChannelList(params) {
    try {
      const response = await cabocilAPI.GetChannels("", {}, params)
      const body = await response.json()

      if (response.status !== 200) {
        return
      }

      setChannelList(Utils.ShuffleArray(body.data))
    } catch (e) {
      console.error('Error loading channels:', e)
    }
  }

  // Throttled scroll handler
  const handleScroll = useCallback(() => {
    if (loading || !hasMore) return

    const scrollTop = window.pageYOffset
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight

    // Trigger when user is within 1200px of the bottom
    if (scrollTop + windowHeight >= documentHeight - 1200) {
      loadMoreVideos(page, videoIDs)
    }
  }, [loading, hasMore, page, videoIDs, loadMoreVideos])

  // Throttle scroll events for better performance
  useEffect(() => {
    let timeoutId = null

    const throttledScrollHandler = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        handleScroll()
      }, 100) // 100ms throttle
    }

    window.addEventListener('scroll', throttledScrollHandler, { passive: true })

    return () => {
      window.removeEventListener('scroll', throttledScrollHandler)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [handleScroll])

  // Featured Video is the first one
  const featuredVideo = videoList.length > 0 ? videoList[0] : null
  const otherVideos = videoList.length > 0 ? videoList.slice(1) : []

  return (
    <div className="flex flex-col gap-8 w-full min-h-screen pb-10">

      {/* Featured Video Section */}
      {featuredVideo && (
        <div className="w-full relative h-[400px] sm:h-[500px] rounded-3xl overflow-hidden shadow-2xl group border border-slate-200 dark:border-slate-800">
          <div className="absolute inset-0 bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featuredVideo.image_url}
              alt={featuredVideo.title}
              className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

          <div className="absolute bottom-0 left-0 p-6 sm:p-10 w-full max-w-3xl space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Sedang Populer
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight line-clamp-2 drop-shadow-lg">
              {featuredVideo.title}
            </h2>
            <div className="flex items-center gap-3 text-slate-200 font-medium">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={featuredVideo.channel.image_url}
                className="w-8 h-8 rounded-full border border-white/50"
                alt={featuredVideo.channel.name}
              />
              <span>{featuredVideo.channel.name}</span>
            </div>

            <div className="pt-4">
              <Link href={`/watch/${featuredVideo.id}`}>
                <Button className="rounded-full h-12 px-8 text-lg gap-2 bg-white text-slate-900 hover:bg-slate-100 font-bold shadow-lg shadow-white/10 hover:shadow-xl transition-all hover:-translate-y-1">
                  <Play className="fill-slate-900" size={20} />
                  Tonton Sekarang
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Channel List */}
      <div className='w-full'>
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-xl font-bold dark:text-white text-slate-800">Channel Favorit</h3>
        </div>
        <div className="flex gap-4 pb-4 overflow-x-auto scrollbar-hide snap-x w-full">
          {channelList.map((oneChannel) => (
            <div key={oneChannel.id} className="snap-start flex-none">
              <ChannelList
                channelId={oneChannel.id}
                channelImageUrl={oneChannel.image_url}
                channelName={oneChannel.name}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Video Grid */}
      <div>
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="text-xl font-bold dark:text-white text-slate-800">
            Video Terbaru
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-y-8 gap-x-6">
          {otherVideos.map((oneVideo) => (
            <VideoCard
              key={oneVideo.id}
              ytkiddId={oneVideo.id}
              videoId={oneVideo.id}
              videoImageUrl={oneVideo.image_url}
              channelId={oneVideo.channel.id}
              creatorImageUrl={oneVideo.channel.image_url}
              shortedVideoTitle={oneVideo.title}
              creatorName={oneVideo.channel.name}
              canAction={oneVideo.can_action}
            />
          ))}
        </div>
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
              <span className="text-slate-500 text-sm font-medium animate-pulse">Memuat video seru...</span>
            </div>
          </div>
        )}

        {!hasMore && videoList.length > 0 && (
          <div className="text-center py-12">
            <span className="px-6 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-sm font-medium">
              Kamu sudah melihat semua video! 🎉
            </span>
          </div>
        )}
      </div>

    </div>
  )
}