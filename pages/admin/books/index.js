import cabocilAPI from "@/apis/cabocil_api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Eye, Filter, Pencil, PlusIcon, Search, Trash } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { toast } from "react-toastify";
import { RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Books() {
  const [bookList, setBookList] = useState([]);
  const searchParams = useSearchParams();
  const [enableDev, setEnableDev] = useState(false);
  const [tagOptions, setTagOptions] = useState([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [uploadBookStatus, setUploadBookStatus] = useState({});
  const [selectedBook, setSelectedBook] = useState(null);
  const [isBookDialogOpen, setIsBookDialogOpen] = useState(false);

  // Filter states
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [title, setTitle] = useState("");
  const [sort, setSort] = useState("id_desc");
  const [access, setAccess] = useState("all");
  const [loading, setLoading] = useState(false);
  const [accessTags, setAccessTags] = useState([])

  // Temporary filter states for modal (before applying)
  const [tempSelectedTypes, setTempSelectedTypes] = useState([]);
  const [tempSelectedTags, setTempSelectedTags] = useState([]);
  const [tempTitle, setTempTitle] = useState("");
  const [tempSort, setTempSort] = useState("id_desc");
  const [tempAccess, setTempAccess] = useState("all");
  const [tempAccessTags, setTempAccessTags] = useState([])
  const [now, setNow] = useState(0)

  // Available options (you can make these dynamic by fetching from API)
  const typeOptions = [
    { value: "default", label: "Default" },
    { value: "workbook", label: "Workbook" },
  ];

  const sortOptions = [
    { value: "title_asc", label: "A-Z" },
    { value: "title_desc", label: "Z-A" },
    { value: "id_desc", label: "Newest" },
    { value: "id_asc", label: "Oldest" },
    { value: "random", label: "Random" },
  ];

  const accessOptions = [
    { value: "all", label: "All" },
    { value: "free", label: "Free" },
    { value: "premium", label: "Premium" },
  ];

  // Initialize filters from URL params
  useEffect(() => {
    const urlTypes = searchParams.get("types");
    const urlTags = searchParams.get("tags");
    const urlTitle = searchParams.get("title");
    const urlSort = searchParams.get("sort");
    const urlAccess = searchParams.get("access");
    const urlExcludeAccess = searchParams.get("exclude_access");

    if (urlTypes) {
      setSelectedTypes(urlTypes.split(","));
      setTempSelectedTypes(urlTypes.split(","));
    }
    if (urlTags) {
      setSelectedTags(urlTags.split(","));
      setTempSelectedTags(urlTags.split(","));
    }
    if (urlTitle) {
      setTitle(urlTitle);
      setTempTitle(urlTitle);
    }
    if (urlSort) {
      setSort(urlSort);
      setTempSort(urlSort);
    }

    // Determine access value from URL params
    if (urlAccess === "free") {
      setAccess("free");
      setTempAccess("free");
    } else if (urlExcludeAccess === "free") {
      setAccess("premium");
      setTempAccess("premium");
    } else {
      setAccess("all");
      setTempAccess("all");
    }

    if (searchParams && searchParams.get("dev") === "true") {
      setEnableDev(true);
    } else {
      setEnableDev(false);
    }

  }, [searchParams]);

  useEffect(() => {
    GetUploadBookStatus()
  }, [])

  function GetParams() {
    return {
      types: selectedTypes.join(","),
      tags: selectedTags.join(","),
      title: title,
      sort: sort
    };
  }

  // Fetch books when filters change
  useEffect(() => {
    const params = GetParams()

    // Add access-related params based on access value
    if (access === "free") {
      params.access = "free";
    } else if (access === "premium") {
      params.exclude_access = "free";
    }
    // If access === "all", don't add any access params

    GetBookList(params);
  }, [selectedTypes, selectedTags, title, sort, access, now]);

  useEffect(() => {
    setSort(tempSort);
    setAccess(tempAccess);
  }, [tempSort, tempAccess]);

  async function GetBookList(params) {
    setLoading(true);
    try {
      // Clean up params - remove empty values
      const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value && value !== "") {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await cabocilAPI.GetBooks("", {}, cleanParams);
      const body = await response.json();
      if (response.status !== 200) {
        return;
      }

      setBookList(body.data.books);
      if (body.data.tag_group) {
        setTagOptions(body.data.tag_group)
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function GetUploadBookStatus(silent = false) {
    try {
      const response = await cabocilAPI.GetUploadBookStatus("", {}, {});
      const body = await response.json();

      if (response.status !== 200) {
        toast.error("Error fetching upload book status");
        return;
      }

      setUploadBookStatus(body.data.status_map);

      const params = GetParams()
      GetBookList(params)
    } catch (e) {
      toast.error(e.message || "Failed to fetch status");
    } finally {
    }
  }

  const handleTempTagChange = (tagValue, checked) => {
    if (checked) {
      setTempSelectedTags(prev => [...prev, tagValue]);
    } else {
      setTempSelectedTags(prev => prev.filter(t => t !== tagValue));
    }
  };

  const handleTempTypeChange = (typeVal, checked) => {
    if (checked) {
      setTempSelectedTypes(prev => [...prev, typeVal]);
    } else {
      setTempSelectedTypes(prev => prev.filter(t => t !== typeVal));
    }
  };

  const applyFilters = () => {
    setSelectedTypes(tempSelectedTypes);
    setSelectedTags(tempSelectedTags);
    setTitle(tempTitle);
    setSort(tempSort);
    setAccess(tempAccess);
    setIsFilterModalOpen(false);
    setNow(new Date())
  };

  const clearFilters = () => {
    const defaultValues = {
      types: ["default"],
      tags: [],
      title: "",
      sort: "title_asc",
      access: "all"
    };

    setSelectedTypes(defaultValues.types);
    setSelectedTags(defaultValues.tags);
    setTitle(defaultValues.title);
    setSort(defaultValues.sort);
    setAccess(defaultValues.access);

    setTempSelectedTypes(defaultValues.types);
    setTempSelectedTags(defaultValues.tags);
    setTempTitle(defaultValues.title);
    setTempSort(defaultValues.sort);
    setTempAccess(defaultValues.access);
  };

  const resetTempFilters = () => {
    setTempSelectedTypes(selectedTypes);
    setTempSelectedTags(selectedTags);
    setTempTitle(title);
    setTempSort(sort);
    setTempAccess(access);
  };

  const hasActiveFilters = selectedTypes.length > 0 || selectedTags.length > 0 || title || sort !== "title_asc" || access !== "all";
  const activeFiltersCount = selectedTags.length + (title ? 1 : 0) + (sort !== "title_asc" ? 1 : 0) + (access !== "all" ? 1 : 0);

  async function DeleteBook(bookID) {
    if (!confirm("are you sure want to delete this book?")) { return }

    try {
      const response = await cabocilAPI.DeleteBook("", {}, {
        book_id: bookID
      })
      const body = await response.json();
      if (response.status !== 200) {
        toast.error(`error on delete: ${JSON.stringify(body)}`)
        return
      }

      toast.success(`delete book success`)

      const params = {
        types: selectedTypes.join(","),
        tags: selectedTags.join(","),
        title: title,
        sort: sort
      };
      GetBookList(params)
      setIsBookDialogOpen(false);
    } catch (e) {
      console.error(e)
    }
  }

  const handleBookClick = (book) => {
    setSelectedBook(book);
    setIsBookDialogOpen(true);
  };

  return (
    <main className="">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-none w-[240px]">
          <Card className="sticky top-14 p-3 w-full flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span>Pencarian</span>
              <Button size="smv2" onClick={applyFilters}>
                <Search /> Cari
              </Button>
            </div>

            <div>
              <Label htmlFor="modal-title" className="text-sm font-medium">
                Cari Judul Buku
              </Label>
              <Input
                id="modal-title"
                type="text"
                placeholder="Masukkan judul buku..."
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Type</Label>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="truncate">
                      {tempSelectedTypes.length === 0
                        ? "Select types..."
                        : `${tempSelectedTypes.length} selected`}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <div className="p-4 space-y-2">
                    {typeOptions.map((typeOption) => (
                      <div key={typeOption} className="flex items-center space-x-2">
                        <Checkbox
                          id={`modal-tag-${typeOption.value}`}
                          checked={tempSelectedTypes.includes(typeOption.value)}
                          onCheckedChange={(checked) => handleTempTypeChange(typeOption.value, checked)}
                        />
                        <Label
                          htmlFor={`modal-tag-${typeOption.value}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {typeOption.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-3 bg-accent p-1 rounded">
              {tagOptions.map((tagGroup) => (
                <div key={tagGroup.name}>
                  <Label>{tagGroup.name}</Label>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        <span className="truncate">
                          {tempSelectedTags.length === 0
                            ? "Select tags..."
                            : `${tempSelectedTags.length} selected`}
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <div className="p-4 space-y-2">
                        {tagGroup?.tags?.map((tag) => (
                          <div key={tag} className="flex items-center space-x-2">
                            <Checkbox
                              id={`modal-tag-${tag}`}
                              checked={tempSelectedTags.includes(tag)}
                              onCheckedChange={(checked) => handleTempTagChange(tag, checked)}
                            />
                            <Label
                              htmlFor={`modal-tag-${tag}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {tag}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              ))}
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Akses</Label>
              <Select value={tempAccess} onValueChange={setTempAccess}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih akses..." />
                </SelectTrigger>
                <SelectContent>
                  {accessOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Urutkan</Label>
              <Select value={tempSort} onValueChange={setTempSort}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Urutkan..." />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </Card>
        </div>

        <div className="flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {bookList.map((oneBook) => (
              <div
                key={oneBook.id}
                onClick={() => handleBookClick(oneBook)}
                className="flex h-full flex-col rounded-lg border border-slate-200 bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden cursor-pointer"
              >
                <div
                  style={{'--image-url': `url(${oneBook.cover_file_url})`}}
                  className={`relative aspect-2/3 overflow-hidden bg-contain  bg-repeat bg-(image:--image-url) bg-center`}
                >
                  <img
                    className={`h-full w-full object-contain transition-transform duration-300 backdrop-blur-lg`}
                    src={oneBook.cover_file_url}
                    alt={`Cover of ${oneBook.title}`}
                    loading="lazy"
                  />
                  {oneBook.is_free && <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden">
                    <div
                      className="absolute top-3 right-[-73px] rotate-45 bg-accent text-center text-[8px] font-semibold w-48 py-0.5 shadow-md"
                    >
                      FREE
                    </div>
                  </div>}
                </div>
              </div>
            ))}
          </div>

          {/* No Results */}
          {!loading && bookList.length === 0 && (
            <div className="text-center py-16">
              <div className="max-w-sm mx-auto">
                <Filter className="h-16 w-16 text-gray-300 mx-auto mb-6" />
                <h3 className="text-xl font-semibold mb-2">No books found</h3>
                <p className="mb-6">Try adjusting your filters or search terms to find what you're looking for.</p>
                <Button onClick={clearFilters} variant="outline" className="px-6">
                  Clear all filters
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-none w-[240px] flex">
          <Card className="sticky top-14 p-3 w-full flex flex-col gap-3">
            <Link href="/admin/books/add">
              <Button size="sm" className="w-full">
                <PlusIcon />
                Add Book
              </Button>
            </Link>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Upload Status</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={()=>{GetUploadBookStatus(false)}}
                  className="h-7 w-7 p-0"
                >
                  <RefreshCw className={`h-4 w-4`} />
                </Button>
              </div>

              {uploadBookStatus.length > 0 ? (
                <p className="text-xs text-muted-foreground">No active uploads</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {Object.entries(uploadBookStatus).map(([key, status]) => {
                    const progress = (status.current_page / status.max_page) * 100;
                    const isComplete = status.current_page === status.max_page;

                    return (
                      <div key={key} className="flex flex-col gap-1 p-2 bg-accent rounded-md">
                        <span className="text-xs font-medium truncate" title={key}>
                          {key}
                        </span>
                        <Progress value={progress} className="h-2" />
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            {status.current_page} / {status.max_page} pages
                          </span>
                          {isComplete && (
                            <span className="text-xs text-green-600 font-medium">
                              Complete
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Book Details Dialog */}
      <Dialog open={isBookDialogOpen} onOpenChange={setIsBookDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedBook?.title}</DialogTitle>
          </DialogHeader>

          {selectedBook && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-row gap-2">
                <div className="flex-none w-36">
                  <img
                    className="w-full rounded-lg border"
                    src={selectedBook.cover_file_url}
                    alt={`Cover of ${selectedBook.title}`}
                  />
                </div>

                <div className="flex-1">
                  <div className="space-y-1.5 text-sm">
                    <div>
                      <label className="font-medium text-muted-foreground">ID / Slug</label>
                      <p className="bg-accent p-2 rounded text-xs break-all">{selectedBook.id} / {selectedBook.slug}</p>
                    </div>

                    <div>
                      <label className="font-medium text-muted-foreground">Title</label>
                      <p className="bg-accent p-2 rounded text-xs break-all">{selectedBook.title}</p>
                    </div>

                    <div>
                      <label className="font-medium text-muted-foreground">Type</label>
                      <p className="bg-accent p-2 rounded text-xs break-all">{selectedBook.type}</p>
                    </div>

                    <div>
                      <label className="font-medium text-muted-foreground">Tags</label>
                      <p className="bg-accent p-2 rounded text-xs break-all">
                        {selectedBook.tags.join(", ")}
                      </p>
                    </div>

                    <div>
                      <label className="font-medium text-muted-foreground">Free?</label>
                      <p className="bg-accent p-2 rounded text-xs break-all">
                        {selectedBook.is_free ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              <DialogFooter className="flex gap-2">
                <Link href={`/${selectedBook.type === "default" ? "books" : "workbooks"}/${selectedBook.slug}/read?page=1`}>
                  <Button variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    Read
                  </Button>
                </Link>
                <Link href={`/admin/books/${selectedBook.id}/edit`}>
                  <Button variant="outline">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  onClick={() => DeleteBook(selectedBook.id)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
