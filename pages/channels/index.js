

import cabocilAPI from '@/apis/cabocil_api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Utils from '@/models/Utils'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function Channels() {
  const [channelList, setChannelList] = useState([])
  const [blacklistChannelMap, setBlacklistChannelMap] = useState({})

  useEffect(() => {
    GetChannelList({})
    initializeBlacklistChannelMap()
  }, [])

  async function GetChannelList(params) {
    try {
      const response = await cabocilAPI.GetChannels("", {}, params)
      const body = await response.json()
      if (response.status !== 200) {
        return
      }

      setChannelList(body.data)
    } catch (e) {
      console.error(e)
    }
  }

  function initializeBlacklistChannelMap() {
    if (!localStorage.getItem(`CABOCIL:BLACKLIST_CHANNEL_MAP`)) {
      localStorage.setItem(`CABOCIL:BLACKLIST_CHANNEL_MAP`, '{}')
    }
    var tmpBlacklistChannelMap = JSON.parse(localStorage.getItem(`CABOCIL:BLACKLIST_CHANNEL_MAP`))
    setBlacklistChannelMap(tmpBlacklistChannelMap)
  }

  function handleCheckChange(e, channelID) {
    if (!localStorage.getItem(`CABOCIL:BLACKLIST_CHANNEL_MAP`)) {
      localStorage.setItem(`CABOCIL:BLACKLIST_CHANNEL_MAP`, '{}')
    }

    var tmpBlacklistChannelMap = JSON.parse(localStorage.getItem(`CABOCIL:BLACKLIST_CHANNEL_MAP`))

    if (tmpBlacklistChannelMap[channelID]) {
      tmpBlacklistChannelMap[channelID] = false
    } else {
      tmpBlacklistChannelMap[channelID] = true
    }

    localStorage.setItem(`CABOCIL:BLACKLIST_CHANNEL_MAP`, JSON.stringify(tmpBlacklistChannelMap))
    setBlacklistChannelMap(tmpBlacklistChannelMap)
  }

  function checkAll() {
    localStorage.setItem(`CABOCIL:BLACKLIST_CHANNEL_MAP`, '{}')
    setBlacklistChannelMap({})
  }

  function unCheckAll() {
    var tmpBlacklistChannelMap = {}
    channelList.forEach((oneChannel) => {
      tmpBlacklistChannelMap[oneChannel.id] = true
    })
    localStorage.setItem(`CABOCIL:BLACKLIST_CHANNEL_MAP`, JSON.stringify(tmpBlacklistChannelMap))
    setBlacklistChannelMap(tmpBlacklistChannelMap)
  }

  return (
    <main>
      <div className="mb-6 flex flex-row items-center justify-between">
        <div>
          <h1 className="text-xl">Daftar Channel</h1>
          <small>kamu dapat memilih channel mana yang akan muncul pada rekomendasi mu</small>
        </div>
        <div className='flex gap-2'>
          <Button onClick={() => checkAll()}>Check All</Button>
          <Button onClick={() => unCheckAll()}>Uncheck All</Button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-x-5 gap-y-8">
        {channelList.map((oneChannel) => (
          <Card key={oneChannel.id} className="p-4">
            <Link href={`/channels/${oneChannel.id}`} className='group'>
              <div className='flex items-center gap-3'>
                <Avatar className="h-14 w-14 group-hover:scale-105">
                  <AvatarImage src={oneChannel.image_url} />
                  <AvatarFallback><img src="/icons/cabocil-logo-clear.png" /></AvatarFallback>
                </Avatar>
                <span className='group-hover:text-amber-600'>{oneChannel.name}</span>
                <small className="">{oneChannel.string_tags}</small>
              </div>
            </Link>
            <div className="flex justify-end mt-3">
              <Switch
                type="checkbox"
                defaultChecked={!blacklistChannelMap[oneChannel.id]}
                checked={!blacklistChannelMap[oneChannel.id]}
                onClick={(e) => handleCheckChange(e, oneChannel.id)}
              />
            </div>
          </Card>
        ))}
      </div>
    </main>
  )
}
