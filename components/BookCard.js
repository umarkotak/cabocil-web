import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import Link from "next/link"

export default function BookCard({oneBook}) {
  return(
    <div>
      <HoverCard>
        <HoverCardTrigger asChild>
          <a
            href={`/${oneBook.type === "book" ? "books" : "workbooks"}/${oneBook.slug}/read?page=1`}
            key={oneBook.id}
            className="group block"
          >
            <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden group-hover:shadow-md group-hover:shadow-accent">
              <div className="relative aspect-2/3 overflow-hidden">
                <img
                  className="h-full w-full object-fit transition-transform duration-300"
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
              </div>
            </div>
          </a>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="flex flex-col gap-3">
            <span className="text-sm">{oneBook.title}</span>

            {/* <pre className="text-xs bg-accent p-1 rounded overflow-auto">
              {JSON.stringify(oneBook, " ", "  ")}
            </pre> */}
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  )
}
