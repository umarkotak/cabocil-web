import cabocilAPI from "@/apis/cabocil_api"
import { LoadingSpinner } from "@/components/ui/spinner"
import { ArrowLeft, ArrowRight, FullscreenIcon, PrinterIcon, X, Trash2, EyeIcon } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { toast } from "react-toastify"

var tmpBookDetail = {}
var tmpMaxPageNumber = 0

export default function Read() {
  const router = useRouter()

  const [bookDetail, setBookDetail] = useState({})
  const searchParams = useSearchParams()
  const [activePage, setActivePage] = useState({})
  const [activePageNumber, setActivePageNumber] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [errNeedSubscription, setErrNeedSubscription] = useState(false)

  // New states for delete functionality
  const [selectedPageIds, setSelectedPageIds] = useState([])
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    tmpBookDetail = {}
    tmpMaxPageNumber = 0
  }, [])

  useEffect(() => {
    if (bookDetail.slug === router.query.book_id) { return }

    GetBookDetail(router.query.book_id)
  }, [router])

  useEffect(() => {
    if (!tmpBookDetail.id) { return }

    if (!tmpBookDetail.contents) { return }

    var pageNumber = parseInt(searchParams.get("page"))
    var pageIndex = pageNumber - 1
    if (pageIndex <= 0) { pageIndex = 0 }
    if (pageIndex >= tmpMaxPageNumber) { pageIndex = tmpMaxPageNumber - 1 }

    setActivePageNumber(pageIndex+1)

    if (!tmpBookDetail.contents[pageIndex] || !tmpBookDetail.contents[pageIndex].image_file_url) { return }
    setActivePage(tmpBookDetail.contents[pageIndex])
  }, [router, bookDetail])

  async function GetBookDetail(bookID) {
    if (!bookID) { return }

    if (bookDetail.id === parseInt(bookID)) { return }

    try {
      const response = await cabocilAPI.GetBookDetail("", {}, {
        book_id: bookID
      })
      const body = await response.json()
      if(response.status === 400){
        if (body.error.code === "subscription_required"){
          setErrNeedSubscription(true)
          return
        }
      }
      if (response.status !== 200) {
        return
      }

      tmpBookDetail = body.data
      tmpMaxPageNumber = tmpBookDetail.contents.length
      // setBookDetail(tmpBookDetail)

      const preloadImage = async (imageUrl) => {
        const image = new Image();
        image.src = imageUrl;
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
        });
      };

      let index = 0
      for(const oneContent of tmpBookDetail.contents) {
        await preloadImage(oneContent.image_file_url);
        // console.log(`PRELOADED ${index+1} / ${tmpMaxPageNumber}`)
        if (index === parseInt(tmpMaxPageNumber / 4)) {
          setBookDetail(tmpBookDetail)
        }
        index += 1
      }

    } catch (e) {
      console.error(e)
    }
  }

  // New function to handle page deletion
  async function DeleteSelectedPages() {
    if (selectedPageIds.length === 0) {
      alert("Please select pages to delete")
      return
    }

    if (!confirm(`Are you sure you want to delete ${selectedPageIds.length} page(s)?`)) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await cabocilAPI.DeleteBookPages("", {}, {
        book_id: bookDetail.id,
        book_content_ids: selectedPageIds
      })

      if (response.status === 200) {
        // Refresh book detail after successful deletion
        setSelectedPageIds([])
        setIsDrawerOpen(false)

        // Reset the temp variables to force refresh
        tmpBookDetail = {}
        tmpMaxPageNumber = 0

        // Reload book detail
        await GetBookDetail(router.query.book_id)

        toast.success("Pages deleted successfully")
      } else {
        const body = await response.json()
        toast.error(`Failed to delete pages: ${body.error?.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error("Error deleting pages:", error)
      toast.error("Failed to delete pages. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    RecordBookActivity()
  }, [activePage])

  async function RecordBookActivity() {
    cabocilAPI.PostUserActivity("", {}, {
      book_id: bookDetail.id,
      book_content_id: 0,
      metadata: {
        last_read_book_content_id: activePage.id,
        current_progress: activePage.page_number,
        min_progress: 0,
        max_progress: tmpBookDetail?.contents?.length || 0
      }
    })
  }

  // Toggle checkbox selection
  function togglePageSelection(pageId) {
    console.log(pageId)
    setSelectedPageIds(prev => {
      if (prev.includes(pageId)) {
        return prev.filter(id => id !== pageId)
      } else {
        return [...prev, pageId]
      }
    })
  }

  // Select all pages
  function selectAllPages() {
    if (selectedPageIds.length === bookDetail.contents.length) {
      setSelectedPageIds([])
    } else {
      setSelectedPageIds(bookDetail.contents.map(page => page.id))
    }
  }

  function NextPage() {
    if (activePageNumber >= tmpMaxPageNumber) { return }
    router.push({
      pathname: `/books/${router.query.book_id}/read`,
      search: `?page=${activePageNumber+1}`
    })
  }

  function PrevPage() {
    if (activePageNumber <= 1) { return }
    router.push({
      pathname: `/books/${router.query.book_id}/read`,
      search: `?page=${activePageNumber-1}`
    })
  }

  function ToggleFullScreen() {
    setIsFullscreen(!isFullscreen)
  }

  function ToggleDrawer() {
    setIsDrawerOpen(!isDrawerOpen)
    // Reset selections when closing drawer
    if (isDrawerOpen) {
      setSelectedPageIds([])
    }
  }

  function GoToPage(pageNumber) {
    if (pageNumber === activePageNumber) { return }

    if (bookDetail.can_action && selectedPageIds.length > 0) {
      // If in delete mode, don't navigate
      return
    }

    setIsDrawerOpen(false)
    router.push({
      pathname: `/books/${router.query.book_id}/read`,
      search: `?page=${pageNumber}`
    })
  }

  const [visibleItems, setVisibleItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingComplete, setLoadingComplete] = useState(false);

  // Initialize with first item
  useEffect(() => {
    if (bookDetail?.contents?.length > 0) {
      setVisibleItems([bookDetail?.contents[0]]);
    }
  }, [bookDetail]);

  // Handle when an image finishes loading
  const handleImageLoad = (loadedId) => {
    // Add next item if available
    if (currentIndex + 1 < bookDetail?.contents.length) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setVisibleItems(prev => [...prev, bookDetail?.contents[nextIndex]]);
    } else {
      setLoadingComplete(true);
    }
  };

  return(
    <main className="">
      {errNeedSubscription &&
        <div className="p-4 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300" role="alert"> Kamu harus berlangganan CaBocil premium untuk mengakses buku ini. <Link href="/subscription/package" className="underline">Berlangganan Sekarang</Link>.</div>
      }

      {!loadingComplete && <div className="bg-gray-200 h-1.5">
        <div
          className="bg-blue-600 h-full transition-all duration-300 ease-out"
          style={{ width: `${(visibleItems?.length / bookDetail.contents?.length) * 100}%` }}
        ></div>
      </div>}

      <div
        className={`bg-background ${isFullscreen ? `
          fixed top-0 left-0 w-full h-screen z-50
        ` : `
          h-[calc(100vh-60px)] relative overflow-hidden
        `}`}
      >
        {visibleItems && visibleItems.map((page, index) => (
          <img
            key={index}
            className={`border border-gray-500 ${isFullscreen ? `
              object-contain absolute top-0 left-0 w-full h-screen
            ` : `
              max-h-[calc(100vh-60px)] object-contain mx-auto
            `} ${activePage.image_file_url === page.image_file_url ? "block" : "hidden"}`}
            src={page.image_file_url}
            onLoad={()=>handleImageLoad()}
            onError={()=>handleImageLoad()}
          />
        ))}

        {/* Controls */}
        <div className="absolute z-10 top-2 right-2 flex justify-start items-center gap-2">
          {bookDetail.pdf_url && bookDetail.pdf_url !== "" &&
            <a href={bookDetail.pdf_url} target="_blank">
              <button className="rounded-lg hover:scale-110 bg-white text-black bg-opacity-50 duration-500 p-1.5 text-sm">
                <span className="text-black"><PrinterIcon size={22} /></span>
              </button>
            </a>
          }
          <button
            className="rounded-lg hover:scale-110 bg-white text-black bg-opacity-50 duration-500 py-1 px-1.5 text-sm"
            onClick={ToggleDrawer}
          >
            Select Page
          </button>
          <button className="rounded-lg hover:scale-110 bg-white text-black bg-opacity-50 duration-500 py-1 px-1.5 text-sm">
            <span className="">{activePageNumber} / {tmpMaxPageNumber}</span>
          </button>
          <button
            className="rounded-lg hover:scale-110 bg-white text-black bg-opacity-50 duration-500 py-1 px-1.5 text-sm"
            onClick={ToggleFullScreen}
          >
            <span className=""><FullscreenIcon size={20} /></span>
          </button>
        </div>

        {/* Navigation arrows */}
        <button
          className="absolute z-0 top-0 left-0 w-1/2 h-full bg-transparent hover:cursor-w-resize hover:bg-zinc-500/10 rounded-l-lg flex justify-start items-center"
          onClick={PrevPage}
        >
          <span className="bg-white opacity-50 text-black"><ArrowLeft /></span>
        </button>
        <button
          className="absolute z-0 top-0 right-0 w-1/2 h-full bg-transparent hover:cursor-e-resize hover:bg-zinc-500/5 rounded-r-lg flex justify-end items-center"
          onClick={NextPage}
        >
          <span className="bg-white opacity-50 text-black"><ArrowRight /></span>
        </button>
      </div>

      {/* Drawer overlay */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={ToggleDrawer}
        />
      )}

      {/* Page selection drawer */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
        isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Select Page</h3>
            <button
              onClick={ToggleDrawer}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Delete controls - only show if can_action is true */}
        {bookDetail.can_action && (
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
                onClick={DeleteSelectedPages}
                disabled={selectedPageIds.length === 0 || isDeleting}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedPageIds.length === 0 || isDeleting
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600'
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
            {visibleItems && visibleItems.map((page, index) => (
              <div
                key={index}
                className={`relative cursor-pointer group transition-all duration-200 ${
                  activePageNumber === index + 1
                    ? 'ring-2 ring-blue-500 ring-offset-2'
                    : 'hover:scale-105 hover:shadow-lg'
                } ${
                  bookDetail.can_action && selectedPageIds.includes(page.id)
                    ? 'ring-2 ring-red-500 ring-offset-2'
                    : ''
                }`}
                // onClick={() => GoToPage(index + 1)}
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