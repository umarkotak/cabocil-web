import cabocilAPI from "@/apis/cabocil_api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookIcon, ImageIcon, PlayIcon, TvIcon } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function Admin() {
  const [bookList, setBookList] = useState([])
  const searchParams = useSearchParams()
  const [enableDev, setEnableDev] = useState(false)
  const [bookParams, setBookParams] = useState({})

  useEffect(() => {
    GetBookList(bookParams)

    if (searchParams && searchParams.get("dev")==="true") {
      setEnableDev(true)
    } else {
      setEnableDev(false)
    }
  }, [searchParams])

  async function GetBookList(params) {
    try {
      params.types = "default"
      const response = await cabocilAPI.GetBooks("", {}, params)
      const body = await response.json()
      if (response.status !== 200) {
        return
      }

      setBookList(body.data.books)
    } catch (e) {
      console.error(e)
    }
  }

  return(
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Menu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-row flex-wrap items-center justify-start gap-2">
            <Link href="/admin/books"><Button variant="outline">
              <BookIcon />
              Manage Books
            </Button></Link>
            <Link href="/admin/channels"><Button variant="outline">
              <TvIcon />
              Manage Channels
            </Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
