"use client"
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'

import cabocilAPI from '@/apis/cabocil_api'
import VideoCard from '@/components/VideoCard'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

export default function Channel() {
  const router = useRouter()

  const [channelDetail, setChannelDetail] = useState({})
  const [videoList, setVideoList] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [queryParams, setQueryParams] = useState({
    sort: "id_desc",
    limit: 25,
    page: 1,
  })

  // Reset pagination when sort changes
  useEffect(() => {
    if (!router.query.channel_id) { return }

    setVideoList([])
    setQueryParams(prev => ({ ...prev, page: 1 }))
    setHasMore(true)
  }, [queryParams.sort, router.query.channel_id])

  // Fetch data when page changes
  useEffect(() => {
    if (!router.query.channel_id) { return }

    GetChannelDetail(router.query.channel_id)
  }, [router.query.channel_id, queryParams.page])

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (loading || !hasMore) return

    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
    const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight
    const clientHeight = document.documentElement.clientHeight || window.innerHeight

    // Trigger when user scrolls to 80% of the page
    if (scrollTop + clientHeight >= scrollHeight * 0.8) {
      setQueryParams(prev => ({ ...prev, page: prev.page + 1 }))
    }
  }, [loading, hasMore])

  // Add scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  async function GetChannelDetail(channelID) {
    if (loading) return

    setLoading(true)
    try {
      const response = await cabocilAPI.GetChannelDetail("", {}, {
        ...queryParams,
        channel_id: channelID,
      })
      const body = await response.json()

      if (response.status !== 200) {
        setLoading(false)
        return
      }

      // Set channel detail only on first page
      if (queryParams.page === 1) {
        setChannelDetail(body.data.channel)
        setVideoList(body.data.videos)
      } else {
        // Append videos for subsequent pages
        setVideoList(prev => [...prev, ...body.data.videos])
      }

      // Check if there are more videos to load
      if (body.data.videos.length < queryParams.limit) {
        setHasMore(false)
      }

    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSortChange = (newSort) => {
    setQueryParams(prev => ({ ...prev, sort: newSort, page: 1 }))
  }

  return (
    <div className='flex flex-col gap-4'>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={channelDetail.image_url} />
              <AvatarFallback><img src="/images/cookie_kid_logo_circle.png" /></AvatarFallback>
            </Avatar>
            <span className='text-xl'>{channelDetail.name}</span>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className='flex items-center justify-between'>
        <div>
        </div>
        <div className='flex items-center gap-2'>
          <span>Urutkan:</span>
          <Button
            variant={queryParams.sort === "id_desc" ? "default" : "outline"}
            size="smv2"
            onClick={() => handleSortChange("id_desc")}
            disabled={loading}
          >
            Terbaru
          </Button>
          <Button
            variant={queryParams.sort === "random" ? "default" : "outline"}
            size="smv2"
            onClick={() => handleSortChange("random")}
            disabled={loading}
          >
            Acak
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-5 gap-y-8">
        {videoList.map((oneVideo, index) => (
          <VideoCard
            key={`${oneVideo.id}-${index}`} // Added index to ensure unique keys when appending
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

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Memuat video lainnya...</span>
        </div>
      )}

      {/* No more content indicator */}
      {!hasMore && videoList.length > 0 && (
        <div className="flex justify-center items-center py-8 text-gray-500">
          <span>Tidak ada video lagi</span>
        </div>
      )}
    </div>
  )
}