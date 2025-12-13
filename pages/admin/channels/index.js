import cabocilAPI from '@/apis/cabocil_api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PlusIcon, RefreshCcw, Trash } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import Utils from '@/models/Utils'
import { toast } from 'react-toastify'

export default function Channels() {
  const [channelList, setChannelList] = useState([])
  const [channelParams, setChannelParams] = useState({})
  const [blacklistChannelMap, setBlacklistChannelMap] = useState({})
  const [selectedChannels, setSelectedChannels] = useState(new Set())

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
        "max_page": 5,
        "break_on_exists": breakOnExists
      }

      const response = await cabocilAPI.PostScrapYoutubeVideos("", {}, scrapParams)

      const body = await response.json()

      if (response.status !== 200) {
        toast.error(`Error scrapping youtube videos: ${body.data}`)
        return
      }

      toast.success(`Success sync ${oneChannel.name}`)

    } catch (e) {
      console.error(e)
    }
  }

  async function DeleteChannel(oneChannel) {
    try {
      const response = await cabocilAPI.DeleteYoutubeChannel("", {}, {
        id: oneChannel.id,
      })

      const body = await response.json()

      if (response.status !== 200) {
        toast.error(`Error deleting youtube channel: ${body.data}`)
        return
      }

      toast.success(`Success delete ${oneChannel.name}`)

    } catch (e) {
      console.error(e)
    }
  }

  function toggleChannelSelection(channelId) {
    setSelectedChannels(prev => {
      const newSet = new Set(prev)
      if (newSet.has(channelId)) {
        newSet.delete(channelId)
      } else {
        newSet.add(channelId)
      }
      return newSet
    })
  }

  function toggleSelectAll() {
    if (selectedChannels.size === channelList.length) {
      setSelectedChannels(new Set())
    } else {
      setSelectedChannels(new Set(channelList.map(ch => ch.id)))
    }
  }

  async function bulkSyncAll() {
    const selected = channelList.filter(ch => selectedChannels.has(ch.id))
    if (selected.length === 0) {
      toast.error('No channels selected')
      return
    }

    toast.info(`Syncing ${selected.length} channels...`)
    for (const channel of selected) {
      await SyncChannel(channel, false)
    }
  }

  async function bulkSyncWithBreak() {
    const selected = channelList.filter(ch => selectedChannels.has(ch.id))
    if (selected.length === 0) {
      toast.error('No channels selected')
      return
    }

    toast.info(`Syncing ${selected.length} channels with break...`)
    for (const channel of selected) {
      await SyncChannel(channel, true)
    }
  }

  async function bulkDelete() {
    if (!confirm("are you sure want to delete these channels?")) {
      return
    }

    const selected = channelList.filter(ch => selectedChannels.has(ch.id))
    if (selected.length === 0) {
      toast.error('No channels selected')
      return
    }

    for (const channel of selected) {
      await DeleteChannel(channel)
    }
    setSelectedChannels(new Set())
    GetChannelList(channelParams)
  }

  async function bulkUpdateActive(active) {
    const selected = channelList.filter(ch => selectedChannels.has(ch.id))
    if (selected.length === 0) {
      toast.error('No channels selected')
      return
    }

    for (const channel of selected) {
      try {
        const response = await cabocilAPI.PatchUpdateYoutubeChannelActive("", {}, {
          id: channel.id,
          active: active,
        })

        const body = await response.json()

        if (response.status !== 200) {
          toast.error(`Error updating youtube channel: ${body.data}`)
          return
        }

        toast.success(`Success update ${channel.name}`)

      } catch (e) {
        console.error(e)
      }
    }
    GetChannelList(channelParams)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-none w-[240px]">

      </div>

      <div className="flex-1">
        {channelList.length > 0 && (
          <div className="flex items-center gap-2 mb-3 p-3 bg-muted rounded-lg">
            <Checkbox
              checked={selectedChannels.size === channelList.length}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm">
              {selectedChannels.size > 0
                ? `${selectedChannels.size} selected`
                : 'Select all'}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {channelList.map((oneChannel) => (
            <Card key={oneChannel.id} className="p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedChannels.has(oneChannel.id)}
                  onCheckedChange={() => toggleChannelSelection(oneChannel.id)}
                  className="mt-4"
                />
                <Link href={`/admin/channels/${oneChannel.id}/edit`} className='group flex-1'>
                  <div className='flex items-center gap-3'>
                    <Avatar className="h-14 w-14 group-hover:scale-105">
                      <AvatarImage src={oneChannel.image_url} />
                      <AvatarFallback><img src="/icons/cabocil-logo-clear.png" /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex-col">
                      <div className='group-hover:text-amber-600 text-sm line-clamp-2'>{oneChannel.active ? '🟢' : '🔴'} {oneChannel.name}</div>
                      <small className="text-xs text-muted-foreground">{oneChannel.string_tags}</small>
                      <small className="flex items-center gap-1 text-xs text-muted-foreground break-all"><RefreshCcw size={12} /> {Utils.GetTimeElapsed(oneChannel.updated_at)}</small>
                    </div>
                  </div>
                </Link>
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

          {selectedChannels.size > 0 && (
            <>
              <div className="border-t pt-3">
                <p className="text-sm font-medium mb-2">Bulk Actions</p>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={bulkSyncAll}
                    className="w-full justify-start"
                  >
                    <RefreshCcw size={16} className="mr-2" />
                    Sync All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={bulkSyncWithBreak}
                    className="w-full justify-start"
                  >
                    <RefreshCcw size={16} className="mr-2" />
                    Sync With Break
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={bulkDelete}
                    className="w-full justify-start"
                  >
                    <Trash size={16} className="mr-2" />
                    Delete
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => bulkUpdateActive(true)}
                    className="w-full justify-start"
                  >
                    🟢 Active
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => bulkUpdateActive(false)}
                    className="w-full justify-start"
                  >
                    🔴 Inactive
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
