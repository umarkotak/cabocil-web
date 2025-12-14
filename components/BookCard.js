import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import Link from "next/link"
import { BookOpen, Tag } from "lucide-react"

export default function BookCard({ oneBook }) {
  return (
    <div>
      <HoverCard>
        <HoverCardTrigger asChild>
          <a
            href={`/${oneBook.type === "default" ? "books" : "workbooks"}/${oneBook.slug}/read?page=1`}
            key={oneBook.id}
            className="group block"
          >
            <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden group-hover:shadow-md group-hover:shadow-accent">
              <div
                style={{ '--image-url': `url(${oneBook.cover_file_url})` }}
                className={`relative aspect-2/3 overflow-hidden bg-contain  bg-repeat bg-(image:--image-url) bg-center`}
              >
                <img
                  className={`h-full w-full object-contain transition-transform duration-300 backdrop-blur-lg`}
                  src={oneBook.cover_file_url}
                  alt={`Cover of ${oneBook.title}`}
                  loading="lazy"
                />
                {/* <div
                  className={`absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs font-semibold text-white border border-accent ${
                    oneBook.is_free ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}
                >
                  {oneBook.is_free ? 'FREE' : 'PREMIUM'}
                </div> */}
                {oneBook.is_free && <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden">
                  <div
                    className="absolute top-3 right-[-73px] rotate-45 bg-accent text-center text-xs font-semibold w-48 py-1 shadow-md"
                  >
                    FREE
                  </div>
                </div>}
                {/* {!oneBook.is_free && <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden">
                  <div
                    className="absolute top-3 right-[-73px] rotate-45 bg-blue-500 text-center text-xs font-semibold w-48 py-1 shadow-md"
                  >
                    PAID
                  </div>
                </div>} */}
              </div>
            </div>
          </a>
        </HoverCardTrigger>
        <HoverCardContent className="w-80 p-0 border-none shadow-xl overflow-hidden">
          <div className="relative flex flex-col bg-white dark:bg-slate-950">
            <div className="p-4 border-t-4 border-accent bg-slate-50/50 dark:bg-slate-900/50">
              <h4 className="font-bold text-base leading-snug text-slate-900 dark:text-slate-50 mb-2 line-clamp-2">
                {oneBook.title}
              </h4>

              <div className="flex flex-wrap gap-2">
                {oneBook.tags && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <Tag size={10} />
                    {oneBook.tags}
                  </span>
                )}
              </div>
            </div>

            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span className="font-medium">{oneBook.content_count || 0} items</span>
              </div>

              <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${oneBook.is_free ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'}`}>
                {oneBook.is_free ? 'Free' : 'Premium'}
              </div>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  )
}
