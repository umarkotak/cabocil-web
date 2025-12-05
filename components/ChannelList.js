
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'

export default function ChannelList({ channelId, channelImageUrl, channelName }) {
  return (
    <Link href={`/channels/${channelId}`} className="group block">
      <div className="flex flex-col items-center gap-2 p-3 min-w-[100px] rounded-2xl transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
        <div className="relative">
          <Avatar className="h-16 w-16 ring-2 ring-transparent group-hover:ring-indigo-500 transition-all duration-300 shadow-md">
            <AvatarImage src={channelImageUrl} className="object-cover" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <AvatarFallback><img src="/images/cookie_kid_logo_circle.png" alt="fallback" /></AvatarFallback>
          </Avatar>
        </div>
        <span className="text-xs font-semibold text-center text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-2 max-w-[100px]">
          {channelName}
        </span>
      </div>
    </Link>
  )
}
