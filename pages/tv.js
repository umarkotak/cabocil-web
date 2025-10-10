import { useState, useEffect, useCallback, useRef } from 'react'

import ChannelList from '@/components/ChannelList'
import VideoCard from '@/components/VideoCard'

import cabocilAPI from '@/apis/cabocil_api'
import Utils from '@/models/Utils'
import { useSearchParams } from 'next/navigation'
import { HomeIcon, Link } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AdsenseAd from '@/components/AdsenseAd'

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

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className='w-full pb-4'>
        <div className="flex gap-2 flex-row overflow-auto">
          {channelList.map((oneChannel) => (
            <ChannelList
              key={oneChannel.id}
              channelId={oneChannel.id}
              channelImageUrl={oneChannel.image_url}
              channelName={oneChannel.name}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6">
        {/* <AdsenseAd /> */}
        {videoList.map((oneVideo) => (
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
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}

      {!hasMore && videoList.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          No more videos to load
        </div>
      )}
    </div>
  )
}