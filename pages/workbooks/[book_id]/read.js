import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/router"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  EyeIcon,
  FullscreenIcon,
  Printer,
  X,
  Trash2,
} from "lucide-react"
import cabocilAPI from "@/apis/cabocil_api"
import ImageDrawer from "@/components/ImageDrawer"
import { LoadingSpinner } from "@/components/ui/spinner"
import { toast } from "react-toastify"

// Custom hooks
const useBookDetail = (bookId) => {
  const [bookDetail, setBookDetail] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchBookDetail = useCallback(async (id) => {
    if (!id || loading || error) return

    setLoading(true)
    setError(null)

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

      // Preload images in background
      body.data.contents.forEach((content) => {
        const img = new Image()
        img.src = content.image_file_url
      })
    } catch (err) {
      console.error("Failed to fetch book detail:", err)
      setError("fetch_failed")
    } finally {
      setLoading(false)
    }
  }, [loading])

  return { bookDetail, error, loading, fetchBookDetail }
}

const usePageNavigation = (bookDetail, searchParams) => {
  const [activePageNumber, setActivePageNumber] = useState(1)
  const [activePage, setActivePage] = useState(null)

  useEffect(() => {
    if (!bookDetail?.contents?.length) return

    const pageParam = searchParams.get("page")
    const pageNumber = pageParam ? parseInt(pageParam) : 1
    const pageIndex = Math.max(0, Math.min(pageNumber - 1, bookDetail.contents.length - 1))

    setActivePageNumber(pageIndex + 1)
    setActivePage(bookDetail.contents[pageIndex])
  }, [bookDetail, searchParams])

  return { activePageNumber, activePage }
}

const useActivityTracking = (bookDetail, activePage) => {
  useEffect(() => {
    if (!bookDetail?.id || !activePage?.id) return

    const recordActivity = async () => {
      try {
        await cabocilAPI.PostUserActivity("", {}, {
          book_id: bookDetail.id,
          book_content_id: 0,
          metadata: {
            last_read_book_content_id: activePage.id,
            current_progress: activePage.page_number,
            min_progress: 0,
            max_progress: bookDetail.contents.length,
          },
        })
      } catch (err) {
        console.error("Failed to record activity:", err)
      }
    }

    recordActivity()
  }, [bookDetail, activePage])
}

const useProgressiveImageLoading = (bookDetail) => {
  const [visibleItems, setVisibleItems] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loadingComplete, setLoadingComplete] = useState(false)

  useEffect(() => {
    if (bookDetail?.contents?.length) {
      setVisibleItems([bookDetail.contents[0]])
      setCurrentIndex(0)
      setLoadingComplete(false)
    }
  }, [bookDetail])

  const handleImageLoad = useCallback(() => {
    if (!bookDetail?.contents) return

    if (currentIndex + 1 < bookDetail.contents.length) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      setVisibleItems((prev) => [...prev, bookDetail.contents[nextIndex]])
    } else {
      setLoadingComplete(true)
    }
  }, [currentIndex, bookDetail])

  const progress = useMemo(() => {
    if (!bookDetail?.contents?.length) return 0
    return (visibleItems.length / bookDetail.contents.length) * 100
  }, [visibleItems.length, bookDetail?.contents?.length])

  return { visibleItems, loadingComplete, handleImageLoad, progress }
}

// Main component
export default function Read() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookId = router.query.book_id

  const { bookDetail, error, fetchBookDetail } = useBookDetail(bookId)
  const { activePageNumber, activePage } = usePageNavigation(bookDetail, searchParams)
  const { visibleItems, loadingComplete, handleImageLoad, progress } = useProgressiveImageLoading(bookDetail)

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedPageIds, setSelectedPageIds] = useState([])
  const [isDeleting, setIsDeleting] = useState(false)

  useActivityTracking(bookDetail, activePage)

  useEffect(() => {
    if (bookId && bookId !== bookDetail?.slug) {
      fetchBookDetail(bookId)
    }
  }, [bookId, bookDetail?.slug, fetchBookDetail])

  const maxPageNumber = bookDetail?.contents?.length || 0

  const navigateToPage = useCallback(
    (pageNum, replace = false) => {
      const method = replace ? router.replace : router.push
      method({
        pathname: `/workbooks/${bookId}/read`,
        query: { page: pageNum },
      })
    },
    [router, bookId]
  )

  const handleNextPage = useCallback(() => {
    if (activePageNumber < maxPageNumber) {
      navigateToPage(activePageNumber + 1)
    }
  }, [activePageNumber, maxPageNumber, navigateToPage])

  const handlePrevPage = useCallback(() => {
    if (activePageNumber > 1) {
      navigateToPage(activePageNumber - 1)
    }
  }, [activePageNumber, navigateToPage])

  const toggleFullScreen = useCallback(() => {
    setIsFullscreen((prev) => !prev)
  }, [])

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen((prev) => !prev)
  }, [])

  const goToPage = useCallback(
    (pageNumber) => {
      if (pageNumber === activePageNumber) return
      if (bookDetail?.can_action && selectedPageIds.length > 0) return

      setIsDrawerOpen(false)
      navigateToPage(pageNumber, true)
    },
    [activePageNumber, bookDetail?.can_action, selectedPageIds.length, navigateToPage]
  )

  const togglePageSelection = useCallback((pageId) => {
    setSelectedPageIds((prev) =>
      prev.includes(pageId) ? prev.filter((id) => id !== pageId) : [...prev, pageId]
    )
  }, [])

  const selectAllPages = useCallback(() => {
    if (!bookDetail?.contents) return

    if (selectedPageIds.length === bookDetail.contents.length) {
      setSelectedPageIds([])
    } else {
      setSelectedPageIds(bookDetail.contents.map((page) => page.id))
    }
  }, [bookDetail?.contents, selectedPageIds.length])

  const handleDeleteSelectedPages = useCallback(async () => {
    if (selectedPageIds.length === 0 || isDeleting) return

    setIsDeleting(true)
    try {
      // Add your delete API call here
      const response = await cabocilAPI.DeleteBookPages("", {}, {
        book_id: bookDetail.id,
        book_content_ids: selectedPageIds
      })

      if (response.status === 200) {
        // Refresh book detail after deletion
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
  }, [selectedPageIds, isDeleting, bookId, fetchBookDetail])

  if (error === "subscription_required") {
    return (
      <div className="p-4 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300">
        Kamu harus berlangganan CaBocil premium untuk mengakses buku ini.{" "}
        <Link href="/subscription/package" className="underline">
          Berlangganan Sekarang
        </Link>
        .
      </div>
    )
  }

  return (
    <main>
      <div
        className={`bg-background ${
          isFullscreen
            ? "fixed top-0 left-0 w-full h-screen z-50"
            : "h-[calc(100vh-48px)] overflow-hidden"
        }`}
      >
        {!loadingComplete && (
          <div className="bg-gray-200 h-1.5">
            <div
              className="bg-blue-600 h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="relative h-full">
          {visibleItems.map((page, index) => (
            <div
              key={`page-${page.id}-${index}`}
              className={`relative w-full h-full ${
                activePage?.image_file_url === page.image_file_url ? "block" : "hidden"
              }`}
            >
              <div
                className={`shadow-md ${
                  isFullscreen
                    ? "object-contain absolute top-0 left-0 w-full h-screen"
                    : "mx-auto h-full"
                }`}
              >
                <ImageDrawer
                  imageUrl={page.image_file_url}
                  onImageLoad={handleImageLoad}
                  bookID={bookDetail?.id}
                  bookContentID={page.id}
                  focus={activePage?.image_file_url === page.image_file_url}
                />
              </div>
            </div>
          ))}

          {/* Controls */}
          <div className="absolute z-10 top-12 lg:top-2 left-2 lg:left-[200px] flex gap-1 rounded-lg shadow-sm px-1 py-0.5">
            <button
              className="rounded-lg flex justify-start items-center hover:scale-110 duration-500 p-1 bg-zinc-100"
              onClick={toggleFullScreen}
              aria-label="Toggle fullscreen"
            >
              <FullscreenIcon size={18} className="text-black" />
            </button>
            {bookDetail?.pdf_url && (
              <a href={bookDetail.pdf_url} target="_blank" rel="noopener noreferrer">
                <button
                  className="rounded-lg flex justify-start items-center hover:scale-110 duration-500 p-1 bg-zinc-100"
                  aria-label="Print PDF"
                >
                  <Printer size={18} className="text-black" />
                </button>
              </a>
            )}
          </div>

          <div className="absolute z-10 top-12 lg:top-2 right-2 flex gap-1 rounded-lg shadow-sm px-1 py-0.5">
            <button
              className="rounded-lg flex justify-start items-center hover:scale-110 duration-500 p-1 bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handlePrevPage}
              disabled={activePageNumber <= 1}
              aria-label="Previous page"
            >
              <ArrowLeft size={18} className="text-black" />
            </button>
            <button
              className="rounded-lg flex justify-start items-center gap-1 hover:scale-110 duration-500 py-1 px-3 bg-zinc-100 text-black text-sm"
              onClick={toggleDrawer}
              aria-label="Open page selector"
            >
              <BookOpen size={14} />
              <span>
                {activePageNumber} / {maxPageNumber}
              </span>
            </button>
            <button
              className="rounded-lg flex justify-start items-center hover:scale-110 duration-500 p-1 bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleNextPage}
              disabled={activePageNumber >= maxPageNumber}
              aria-label="Next page"
            >
              <ArrowRight size={18} className="text-black" />
            </button>
          </div>
        </div>
      </div>

      {/* Drawer overlay */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleDrawer}
          aria-hidden="true"
        />
      )}

      {/* Page selection drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Select Page</h3>
            <button
              onClick={toggleDrawer}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close drawer"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Delete controls */}
        {bookDetail?.can_action && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={bookDetail.contents && selectedPageIds.length === bookDetail.contents.length}
                  onChange={selectAllPages}
                  className="rounded border-gray-300"
                />
                <label htmlFor="select-all" className="text-sm font-medium text-gray-700">
                  Select All ({selectedPageIds.length} selected)
                </label>
              </div>

              <button
                onClick={handleDeleteSelectedPages}
                disabled={selectedPageIds.length === 0 || isDeleting}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedPageIds.length === 0 || isDeleting
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-red-500 text-white hover:bg-red-600"
                }`}
              >
                {isDeleting ? (
                  <>
                    <LoadingSpinner size={16} />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete ({selectedPageIds.length})
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="p-4 h-[calc(100vh-90px)] overflow-y-auto pb-20">
          <div className="grid grid-cols-2 gap-3">
            {visibleItems.map((page, index) => (
              <div
                key={`drawer-page-${page.id}`}
                className={`relative group transition-all duration-200 ${
                  activePageNumber === index + 1 ? "ring-2 ring-blue-500 ring-offset-2" : ""
                } ${
                  bookDetail?.can_action && selectedPageIds.includes(page.id)
                    ? "ring-2 ring-red-500 ring-offset-2"
                    : ""
                }`}
              >
                {/* Checkbox */}
                {bookDetail?.can_action && (
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={selectedPageIds.includes(page.id)}
                      onChange={() => togglePageSelection(page.id)}
                      className="w-4 h-4 text-red-600 bg-white border-2 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                      aria-label={`Select page ${page.page_number}`}
                    />
                  </div>
                )}

                {/* Preview */}
                <div className="aspect-3/4 overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={page.image_file_url}
                    alt={`Page ${page.page_number}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Page number */}
                <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {bookDetail?.can_action && `id: ${page.id}, `}
                  {page.page_number}
                </div>

                {/* Active indicator */}
                {/* {activePageNumber === index + 1 && (
                  <div className="absolute top-1 right-1 bg-primary text-white text-xs px-2 py-1 rounded">
                    <EyeIcon size={14} />
                  </div>
                )} */}

                {/* Selection overlay */}
                {/* {bookDetail?.can_action && selectedPageIds.includes(page.id) && (
                  <div className="absolute inset-0 bg-red-500 bg-opacity-20 rounded-lg border-2 border-red-500" />
                )} */}

                {/* Hover overlay */}
                <div
                  className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/30 rounded-lg cursor-pointer"
                  onClick={() => goToPage(index + 1)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Go to page ${page.page_number}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
