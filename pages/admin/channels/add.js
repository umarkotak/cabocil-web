import cabocilAPI from "@/apis/cabocil_api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Utils from "@/models/Utils"
import { classNames } from "@react-pdf-viewer/core"
import { BookIcon, Plane, PlusIcon, SaveIcon, TvIcon } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { toast } from "react-toastify"

export default function AddYoutubeChannel() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [scrapChannelParams, setScrapChannelParams] = useState({
    "channel_id": "",
    "channel_url": "",
    "page_token": "",
    "query": "",
    "max_page": 1,
    "break_on_exists": false
  })

  function HandleChange(e) {
    setScrapChannelParams({
      ...scrapChannelParams,
      [e.target.name]: e.target.value,
    })
  }

  async function StartScrap() {
    try {
      var params = scrapChannelParams

      // console.warn("PARAMS", params)
      params.break_on_exists = `${params.break_on_exists}` == "true"
      params.max_page = parseInt(params.max_page)

      const response = await cabocilAPI.PostScrapYoutubeVideos("", {}, params)
      const body = await response.json()

      if (response.status !== 200) {
        toast.error(`Error adding youtube channel ${body.data}`)
        return
      }

      toast.success(`Success adding youtube channel`)

      router.push("/admin/channels")
    } catch (e) {
      console.error(e)
    }
  }

  return(
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex justify-between items-center">
              <span className="flex gap-1 items-center"><TvIcon size={18} /> Add Channel</span>
              <div className="flex gap-1">
                <div className="flex gap-1">
                  <a href="https://commentpicker.com/youtube-channel-id.php" target="_blank"><Button size="sm">Get Youtube Channel ID</Button></a>
                </div>
                <div className="flex gap-1">
                  <a href="https://www.tunepocket.com/youtube-channel-id-finder" target="_blank"><Button size="sm">Get Youtube Channel ID Alt</Button></a>
                </div>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>


      <Card>
        <CardContent className="p-4">
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-2'>
            <div>
              <label>Channel ID</label>
              <Input name="channel_id" value={scrapChannelParams.channel_id} onChange={HandleChange} />
            </div>
            <div>
              <label>Channel URL</label>
              <Input name="channel_url" value={scrapChannelParams.channel_url} onChange={HandleChange} />
            </div>
            <div>
              <label>Page Token</label>
              <Input name="page_token" value={scrapChannelParams.page_token} onChange={HandleChange} />
            </div>
            <div>
              <label>Query</label>
              <Input name="query" value={scrapChannelParams.query} onChange={HandleChange} />
            </div>
            <div>
              <label>Max Page</label>
              <Input name="max_page" value={scrapChannelParams.max_page} onChange={HandleChange} />
            </div>
            <div>
              <label>Break On Exists</label>
              <Input name="break_on_exists" value={scrapChannelParams.break_on_exists} onChange={HandleChange} />
            </div>
          </div>
          <div className='flex justify-end'>
            <Button onClick={()=>StartScrap()}>
              <Plane />
              Start Scrapping!
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
