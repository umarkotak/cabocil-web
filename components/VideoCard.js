import Link from "next/link"
import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { Button } from "./ui/button"
import { MoreHorizontal } from "lucide-react"
import cabocilAPI from "@/apis/cabocil_api"
import { toast } from "react-toastify"

export default function VideoCard({
  ytkiddId,
  videoImageUrl,
  channelId,
  creatorImageUrl,
  shortedVideoTitle,
  creatorName,
  canAction,
}) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleted, setDeleted] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      const res = await cabocilAPI.DeleteVideo("", {}, {
        youtube_video_id: ytkiddId,
      })
      if (!res.ok) {
        throw new Error("Failed to delete video")
      }
      // Optionally refresh the page or update state after delete
      toast.success("Deleted successfully")

    } catch (error) {
      toast.error(error)

    } finally {
      setIsDeleting(false)
      setDeleted(true)
    }
  }

  return (
    <div className={`group rounded-lg hover:text-amber-600 ${deleted ? "hidden" : ""}`}>
      <div className="overflow-hidden rounded-lg relative">
        <Link href={`/watch/${ytkiddId}`}>
          <img
            className="w-full rounded-lg group-hover:scale-105 transition"
            src={videoImageUrl}
            alt="thumb"
            onLoad={(e) => {
              if (e.target.width / e.target.height < 1.4) {
                e.target.src = "/images/no_video.png"
              }
            }}
          />
        </Link>
        {canAction && (
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-white/70 hover:bg-white"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  disabled={isDeleting}
                  onClick={handleDelete}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <div className="flex mt-2 overflow-hidden">
        <div className="min-w-[50px] p-1">
          <Link href={`/channels/${channelId}`}>
            <Avatar>
              <AvatarImage src={creatorImageUrl} />
              <AvatarFallback>
                <img src="/images/cookie_kid_logo_circle.png" />
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
        <Link href={`/watch/${ytkiddId}`}>
          <div className="flex flex-col w-full ml-1 pr-2">
            <span className="text-[15px] font-semibold break-words line-clamp-2">
              {shortedVideoTitle}
            </span>
            <span className="text-[12px] break-words mt-1">{creatorName}</span>
          </div>
        </Link>
      </div>
    </div>
  )
}
