import cabocilAPI from "@/apis/cabocil_api"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuShortcut, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { classNames } from "@react-pdf-viewer/core"
import { MoreHorizontal, Plus, PlusIcon, Trash } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function AdminChannels() {
  const [bookList, setBookList] = useState([])
  const searchParams = useSearchParams()
  const [bookParams, setBookParams] = useState({})

  useEffect(() => {
    GetBookList(bookParams)
  }, [searchParams])

  async function GetBookList(params) {
    try {
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

  async function DeleteBook(bookID) {
    if (!confirm("are you sure want to delete this book?")) { return }

    try {
      const response = await cabocilAPI.DeleteBook("", {}, {
        book_id: bookID
      })
      if (response.status !== 200) {
        return
      }

      GetBookList(bookParams)
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
              <div>Manage Books</div>
              <Link href="/admin/books/add"><Button size="sm"><PlusIcon />Add Book</Button></Link>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-x-5 gap-y-8">
        {bookList.map((oneBook) => (
          <div key={oneBook.id} className="relative border p-1 shadow-sm rounded-lg hover:bg-accent">
            <div className="absolute top-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button variant="outline" size="icon_sm"><MoreHorizontal /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={()=>DeleteBook(oneBook.id)}>
                      delete
                      <DropdownMenuShortcut><Trash size={14} /></DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Link href={`/books/${oneBook.id}/read?page=1`}>
              <div>
                <img
                  className="flex-none w-full h-64 object-cover z-0 rounded-lg"
                  src={oneBook.cover_file_url}
                />
                <div className="m-1 flex flex-col gap-2">
                  <p className="text-center text-sm line-clamp-1">{oneBook.title}</p>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
