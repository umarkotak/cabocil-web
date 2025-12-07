

import cabocilAPI from '@/apis/cabocil_api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Utils from '@/models/Utils'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PlusIcon, RefreshCcw, Trash } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from 'react-toastify'

export default function Channels() {
  const [channelList, setChannelList] = useState([])
  const [channelParams, setChannelParams] = useState({})
  const [blacklistChannelMap, setBlacklistChannelMap] = useState({})

  useEffect(() => {
    GetChannelList(channelParams)
  }, [])

  async function GetChannelList(params) {
    try {
      const response = await cabocilAPI.GetChannels("", {}, params)
      const body = await response.json()
      if (response.status !== 200) {
        toast.error(`Error getting youtube channels: ${body.data}`)
        return
      }

      setChannelList(body.data)
    } catch (e) {
      console.error(e)
    }
  }

  async function SyncChannel(oneChannel, breakOnExists) {
    try {
      var scrapParams = {
        "channel_id": oneChannel.external_id,
        "page_token": "",
        "query": "",
        "max_page": 20,
        "break_on_exists": breakOnExists
      }

      const response = await cabocilAPI.PostScrapYoutubeVideos("", {}, scrapParams)

      const body = await response.json()

      if (response.status !== 200) {
        toast.error(`Error scrapping youtube videos: ${body.data}`)
        return
      }

      toast.success(`Success sycn ${oneChannel.name}`)

    } catch (e) {
      console.error(e)
    }
  }

  async function DeleteChannel(oneChannel) {
    try {
      if (!confirm("are you sure want to delete this channel?")) {
        return
      }

      const response = await cabocilAPI.DeleteYoutubeChannel("", {}, {
        id: oneChannel.id,
      })

      const body = await response.json()

      if (response.status !== 200) {
        toast.error(`Error deleting youtube channel: ${body.data}`)
        return
      }

      toast.success(`Success delete ${oneChannel.name}`)
      GetChannelList(channelParams)

    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-none w-[240px]">

      </div>

      <div className="flex-1">
        <div className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {channelList.map((oneChannel) => (
            <Card key={oneChannel.id} className="p-4">
              <Link href={`/admin/channels/${oneChannel.id}/edit`} className='group'>
                <div className='flex items-center gap-3'>
                  <Avatar className="h-14 w-14 group-hover:scale-105">
                    <AvatarImage src={oneChannel.image_url}/>
                    <AvatarFallback><img src="/images/cookie_kid_logo_circle.png" /></AvatarFallback>
                  </Avatar>
                  <span className='group-hover:text-amber-600'>{oneChannel.name}</span>
                  <small className="">{oneChannel.string_tags}</small>
                </div>
              </Link>
              <div className="flex justify-end mt-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">action</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuItem onClick={() => SyncChannel(oneChannel, false)}>
                      Sync All
                      <DropdownMenuShortcut><RefreshCcw size={16} /></DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => SyncChannel(oneChannel, true)}>
                      Sync With Break
                      <DropdownMenuShortcut><RefreshCcw size={16} /></DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => DeleteChannel(oneChannel)}>
                      Delete
                      <DropdownMenuShortcut><Trash size={16} /></DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex-none w-[240px]">
        <Card className="sticky top-14 p-3 w-full flex flex-col gap-3">
          <Link href="/admin/channels/add">
            <Button size="sm" variant="default" className="w-full"><PlusIcon />Add Channel</Button>
          </Link>
        </Card>
      </div>
    </div>
  )
}
