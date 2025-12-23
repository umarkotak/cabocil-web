import { useEffect, useState, useCallback, memo } from "react"
import { useRouter } from "next/router"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FullscreenIcon,
  Printer,
  X,
  Trash2,
} from "lucide-react"
import cabocilAPI from "@/apis/cabocil_api"
import ImageDrawer from "@/components/ImageDrawer"
import { LoadingSpinner } from "@/components/ui/spinner"
import { toast } from "react-toastify"

// Memoized thumbnail component
const PageThumbnail = memo(function PageThumbnail({ page, index, isActive, isSelected, canAction, onToggleSelection, onGoToPage }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className={`relative rounded-lg overflow-hidden ${isActive ? "ring-2 ring-blue-500 ring-offset-2" : ""} ${isSelected ? "ring-2 ring-red-500 ring-offset-2" : ""}`}>
      {canAction && (
        <div className="absolute top-2 left-2 z-10">
          <input type="checkbox" checked={isSelected} onChange={() => onToggleSelection(page.id)} className="w-4 h-4 text-red-600 bg-white border-2 border-gray-300 rounded" />
        </div>
      )}
      <div className="aspect-3/4 overflow-hidden rounded-lg bg-gray-200 cursor-pointer" onClick={() => onGoToPage(index + 1)}>
        {!loaded && <div className="w-full h-full animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" />}
        <img src={page.thumbnail_url} alt={`Page ${page.page_number}`} className={`w-full h-full object-cover transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`} loading="lazy" onLoad={() => setLoaded(true)} />
      </div>
      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none">
        {canAction && `id: ${page.id}, `}{page.page_number}
      </div>
    </div>
  )
})

export default function Read() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookId = router.query.book_id

  // Core state
  const [bookDetail, setBookDetail] = useState(null)
  const [error, setError] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedPageIds, setSelectedPageIds] = useState([])
  const [isDeleting, setIsDeleting] = useState(false)

  // Derived state
  const contents = bookDetail?.contents || []
  const pageParam = searchParams.get("page")
  const activeIndex = Math.max(0, Math.min((parseInt(pageParam) || 1) - 1, contents.length - 1))
  const activePage = contents[activeIndex]
  const activePageNumber = activeIndex + 1

  // Fetch book detail
  const fetchBookDetail = useCallback(async (id) => {
    if (!id) return
    try {
      const response = await cabocilAPI.GetBookDetail("", {}, { book_id: id })
      const body = await response.json()
      if (response.status === 400 && body.error?.code === "subscription_required") {
        setError("subscription_required")
        return
      }
      if (response.status !== 200) {
        setError("fetch_failed")
        return
      }
      setBookDetail(body.data)
      // Preload images
      body.data.contents.forEach(c => { const img = new Image(); img.src = c.image_file_url })
    } catch (err) {
      console.error("Failed to fetch book detail:", err)
      setError("fetch_failed")
    }
  }, [])

  useEffect(() => {
    if (bookId && bookId !== bookDetail?.slug) fetchBookDetail(bookId)
  }, [bookId, bookDetail?.slug, fetchBookDetail])

  // Track reading activity
  useEffect(() => {
    if (!bookDetail?.id || !activePage?.id) return
    cabocilAPI.PostUserActivity("", {}, {
      book_id: bookDetail.id,
      book_content_id: 0,
      metadata: { last_read_book_content_id: activePage.id, current_progress: activePage.page_number, min_progress: 0, max_progress: contents.length },
    }).catch(err => console.error("Failed to record activity:", err))
  }, [bookDetail?.id, activePage?.id, activePage?.page_number, contents.length])

  // Navigation
  const navigateToPage = useCallback((pageNum, replace = false) => {
    const method = replace ? router.replace : router.push
    method({ pathname: `/workbooks/${bookId}/read`, query: { page: pageNum } })
  }, [router, bookId])

  const handlePrevPage = () => activePageNumber > 1 && navigateToPage(activePageNumber - 1)
  const handleNextPage = () => activePageNumber < contents.length && navigateToPage(activePageNumber + 1)
  
  const goToPage = useCallback((pageNumber) => {
    if (pageNumber === activePageNumber || (bookDetail?.can_action && selectedPageIds.length > 0)) return
    setIsDrawerOpen(false)
    navigateToPage(pageNumber, true)
  }, [activePageNumber, bookDetail?.can_action, selectedPageIds.length, navigateToPage])

  // Page selection
  const togglePageSelection = useCallback((pageId) => {
    setSelectedPageIds(prev => prev.includes(pageId) ? prev.filter(id => id !== pageId) : [...prev, pageId])
  }, [])

  const selectAllPages = () => {
    setSelectedPageIds(selectedPageIds.length === contents.length ? [] : contents.map(p => p.id))
  }

  const handleDeleteSelectedPages = useCallback(async () => {
    if (selectedPageIds.length === 0 || isDeleting) return
    setIsDeleting(true)
    try {
      const response = await cabocilAPI.DeleteBookPages("", {}, { book_id: bookDetail.id, book_content_ids: selectedPageIds })
      if (response.status === 200) {
        await fetchBookDetail(bookId)
        setSelectedPageIds([])
      } else {
        const body = await response.json()
        toast.error(`Failed to delete pages: ${body.error?.message || 'Unknown error'}`)
      }
    } catch (err) {
      console.error("Failed to delete pages:", err)
    } finally {
      setIsDeleting(false)
    }
  }, [selectedPageIds, isDeleting, bookId, bookDetail?.id, fetchBookDetail])

  if (error === "subscription_required") {
    return (
      <div className="p-4 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300">
        Kamu harus berlangganan CaBocil premium untuk mengakses buku ini.{" "}
        <Link href="/subscription/package" className="underline">Berlangganan Sekarang</Link>.
      </div>
    )
  }

  return (
    <main>
      <div className={`bg-background ${isFullscreen ? "fixed inset-0 z-50" : "h-[calc(100vh-48px)] overflow-hidden"}`}>
        {!bookDetail?.is_free && !bookDetail?.is_subscribed && (
          <div className="flex justify-between items-center px-4 py-2 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300" role="alert">
            <span>Silahkan berlangganan CaBocil premium untuk mendapat akses penuh buku ini</span>
            <Link href="/subscription/package" className="underline">Berlangganan Sekarang</Link>
          </div>
        )}

        <div className="relative h-full">
          {activePage && (
            <div className={`shadow-md ${isFullscreen ? "absolute inset-0" : "mx-auto h-full"}`}>
              <ImageDrawer
                key={activePage.id}
                imageUrl={activePage.image_file_url}
                bookID={bookDetail?.id}
                bookContentID={activePage.id}
                focus={true}
              />
            </div>
          )}

          {/* Controls */}
          <div className="absolute z-10 top-12 lg:top-2 left-2 lg:left-[200px] flex gap-1 rounded-lg shadow-sm px-1 py-0.5">
            <button className="rounded-lg flex items-center hover:scale-110 duration-500 p-1 md:p-3 bg-zinc-100" onClick={() => setIsFullscreen(f => !f)} aria-label="Toggle fullscreen">
              <FullscreenIcon size={18} className="text-black" />
            </button>
            {bookDetail?.pdf_url && (
              <a href={bookDetail.pdf_url} target="_blank" rel="noopener noreferrer">
                <button className="rounded-lg flex items-center hover:scale-110 duration-500 p-1 bg-zinc-100" aria-label="Print PDF">
                  <Printer size={18} className="text-black" />
                </button>
              </a>
            )}
          </div>

          <div className="absolute z-10 top-12 lg:top-2 right-2 flex gap-1 md:gap-2 rounded-lg shadow-sm px-1 py-0.5">
            <button className="rounded-lg flex items-center hover:scale-110 duration-500 p-1 md:p-3 bg-zinc-100 disabled:opacity-50" onClick={handlePrevPage} disabled={activePageNumber <= 1} aria-label="Previous page">
              <ArrowLeft size={18} className="text-black" />
            </button>
            <button className="rounded-lg flex items-center gap-1 hover:scale-110 duration-500 py-1 px-3 md:py-3 bg-zinc-100 text-black text-sm" onClick={() => setIsDrawerOpen(true)} aria-label="Open page selector">
              <BookOpen size={14} />
              <span>{activePageNumber} / {bookDetail?.max_page || contents.length}</span>
            </button>
            <button className="rounded-lg flex items-center hover:scale-110 duration-500 p-1 md:p-3 bg-zinc-100 disabled:opacity-50" onClick={handleNextPage} disabled={activePageNumber >= contents.length} aria-label="Next page">
              <ArrowRight size={18} className="text-black" />
            </button>
          </div>
        </div>
      </div>

      {/* Drawer overlay */}
      {isDrawerOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsDrawerOpen(false)} />}

      {/* Page selection drawer */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ${isDrawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Select Page</h3>
          <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-gray-100 rounded-full" aria-label="Close drawer">
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {bookDetail?.can_action && (
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={contents.length > 0 && selectedPageIds.length === contents.length} onChange={selectAllPages} className="rounded border-gray-300" />
              Select All ({selectedPageIds.length})
            </label>
            <button onClick={handleDeleteSelectedPages} disabled={selectedPageIds.length === 0 || isDeleting} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${selectedPageIds.length === 0 || isDeleting ? "bg-gray-200 text-gray-400" : "bg-red-500 text-white hover:bg-red-600"}`}>
              {isDeleting ? <><LoadingSpinner size={16} /> Deleting...</> : <><Trash2 size={16} /> Delete ({selectedPageIds.length})</>}
            </button>
          </div>
        )}

        <div className="p-4 h-[calc(100vh-90px)] overflow-y-auto pb-20">
          <div className="grid grid-cols-2 gap-3">
            {contents.map((page, index) => (
              <PageThumbnail
                key={page.id}
                page={page}
                index={index}
                isActive={activePageNumber === index + 1}
                isSelected={bookDetail?.can_action && selectedPageIds.includes(page.id)}
                canAction={bookDetail?.can_action}
                onToggleSelection={togglePageSelection}
                onGoToPage={goToPage}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
