"use client"
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

import cabocilAPI from '@/apis/cabocil_api'
import VideoCard from '@/components/VideoCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LinkIcon, SaveIcon, YoutubeIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'react-toastify'

export default function AdminChannelEdit() {
  const router = useRouter()

  const [channelDetail, setChannelDetail] = useState({})
  const [videoList, setVideoList] = useState([])
  const [channelDetailUpdate, setChannelDetailUpdate] = useState({
    "id": "id",
    "external_id": "external_id",
    "name": "name",
    "username": "username",
    "image_url": "image_url",
    "active": "active",
    "channel_link": "#"
  })

  useEffect(() => {
    if (!router.query.channel_id) { return }

    GetChannelDetail(router.query.channel_id)
  }, [router])

  async function GetChannelDetail(channelID) {
    try {
      const responseCh = await cabocilAPI.GetChannelDetail("", {}, {
        channel_id: channelID,
        sort: "id_desc",
      })
      const bodyCh = await responseCh.json()
      if (responseCh.status !== 200) {
        return
      }

      setVideoList(bodyCh.data.videos)

      const responseChd = await cabocilAPI.GetChannelDetailed("", {}, {
        channel_id: channelID,
      })
      const bodyChd = await responseChd.json()
      if (responseChd.status !== 200) {
        return
      }

      setChannelDetail(bodyChd.data)
      setChannelDetailUpdate(bodyChd.data)

    } catch (e) {
      console.error(e)
    }
  }

  function HandleChange(e) {
    setChannelDetailUpdate({
      ...channelDetailUpdate,
      [e.target.name]: e.target.value,
    })
  }

  async function SubmitUpdate() {
    try {
      var params = channelDetailUpdate

      console.warn("PARAMS", params)
      params.active = `${params.active}` == "true"

      const response = await cabocilAPI.PatchUpdateYoutubeChannel("", {}, params)
      const body = await response.json()

      if (response.status !== 200) {
        toast.error(`Error updating youtube channel ${body.data}`)
        return
      }

      toast.success(`Update successfull!`)
      GetChannelDetail(router.query.channel_id)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className='flex flex-col gap-4'>
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="flex items-center justify-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={channelDetail.image_url} />
              <AvatarFallback><img src="/images/cookie_kid_logo_circle.png" /></AvatarFallback>
            </Avatar>
            <div className='flex flex-col'>
              <span className='text-2xl'>{channelDetail.name}</span>
              <Link href={channelDetail?.channel_link || "#"}><Button size="icon_sm"><YoutubeIcon /></Button></Link>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-2'>
            <div>
              <label>ID</label>
              <Input name="id" value={channelDetailUpdate.id} onChange={HandleChange} disabled />
            </div>
            <div>
              <label>External ID</label>
              <Input name="external_id" value={channelDetailUpdate.external_id} onChange={HandleChange} />
            </div>
            <div>
              <label>Name</label>
              <Input name="name" value={channelDetailUpdate.name} onChange={HandleChange} />
            </div>
            <div>
              <label>Username</label>
              <Input name="username" value={channelDetailUpdate.username} onChange={HandleChange} />
            </div>
            <div>
              <label>Image Url</label>
              <Input name="image_url" value={channelDetailUpdate.image_url} onChange={HandleChange} />
            </div>
            <div>
              <label>Active</label>
              <Input name="active" value={channelDetailUpdate.active} onChange={HandleChange} />
            </div>
            <div>
              <label>Channel Link</label>
              <Input name="channel_link" value={channelDetailUpdate.channel_link} onChange={HandleChange} />
            </div>
          </div>
          <div className='flex justify-end'>
            <Button onClick={()=>SubmitUpdate()}>
              <SaveIcon />
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-5 gap-y-8">
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
          />
        ))}
      </div>
    </div>
  )
}
