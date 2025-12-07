import cabocilAPI from "@/apis/cabocil_api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Filter, Search, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { use, useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import BookCard from "@/components/BookCard";

export default function Books() {
  const [bookList, setBookList] = useState([]);
  const searchParams = useSearchParams();
  const [enableDev, setEnableDev] = useState(false);
  const [tagOptions, setTagOptions] = useState([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Filter states
  const [selectedTypes, setSelectedTypes] = useState(["default"]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [title, setTitle] = useState("");
  const [sort, setSort] = useState("title_asc");
  const [access, setAccess] = useState("all");
  const [loading, setLoading] = useState(false);
  const [accessTags, setAccessTags] = useState([])

  // Temporary filter states for modal (before applying)
  const [tempSelectedTypes, setTempSelectedTypes] = useState(["default"]);
  const [tempSelectedTags, setTempSelectedTags] = useState([]);
  const [tempTitle, setTempTitle] = useState("");
  const [tempSort, setTempSort] = useState("title_asc");
  const [tempAccess, setTempAccess] = useState("all");
  const [now, setNow] = useState(0)

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

  // Fetch books when filters change
  useEffect(() => {
    const params = {
      types: selectedTypes.join(","),
      tags: selectedTags.join(","),
      title: title,
      sort: sort
    };

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

  const handleTempTagChange = (tagValue, checked) => {
    if (checked) {
      setTempSelectedTags(prev => [...prev, tagValue]);
    } else {
      setTempSelectedTags(prev => prev.filter(t => t !== tagValue));
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

  return (
    <main className="">
      {/* Filter Button and Active Filters */}
      <div className="sticky top-11 z-30 lg:hidden my-2 bg-background py-1">
        <div className="flex items-center gap-4">
          <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
            <DialogTrigger asChild>
              <Button
                variant="default"
                onClick={() => {
                  resetTempFilters();
                  setIsFilterModalOpen(true);
                }}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filter
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Filter Buku</DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Title Search */}
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

                {/* Tags Dropdown */}
                <div>
                  {tagOptions.map((tagGroup) => (
                    <div key={tagGroup.name}>
                      <div>{tagGroup.name}</div>

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

                {/* Access Select */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Akses</Label>
                  <Select value={tempAccess} onValueChange={setTempAccess}>
                    <SelectTrigger>
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

                {/* Sort Select */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Urutkan</Label>
                  <Select value={tempSort} onValueChange={setTempSort}>
                    <SelectTrigger>
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
              </div>

              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={clearFilters}>
                  Clear All
                </Button>
                <Button onClick={applyFilters}>
                  Apply Filters
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {loading && <LoadingSpinner />}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs flex items-center gap-1"
              >
                Tag: {tagOptions.find(t => t.value === tag)?.label}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-red-500"
                  onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                />
              </Badge>
            ))}
            {title && (
              <Badge
                variant="secondary"
                className="text-xs flex items-center gap-1"
              >
                Title: "{title}"
                <X
                  className="h-3 w-3 cursor-pointer hover:text-red-500"
                  onClick={() => setTitle("")}
                />
              </Badge>
            )}
            {access !== "all" && (
              <Badge
                variant="secondary"
                className="text-xs flex items-center gap-1"
              >
                Access: {accessOptions.find(a => a.value === access)?.label}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-red-500"
                  onClick={() => setAccess("all")}
                />
              </Badge>
            )}
            {sort !== "title_asc" && (
              <Badge
                variant="secondary"
                className="text-xs flex items-center gap-1"
              >
                Sort: {sortOptions.find(s => s.value === sort)?.label}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-red-500"
                  onClick={() => setSort("title_asc")}
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-row gap-3">
        <div className="hidden lg:block w-[240px]">
          <Card className="sticky top-14 p-3 w-full flex flex-col gap-4">
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

            <div className="flex flex-col gap-3 p-1 rounded">
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
                <SelectTrigger>
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
                <SelectTrigger>
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
          {/* Books Grid - Modern Tokopedia-style layout */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {bookList.map((oneBook) => (
              <BookCard key={oneBook.id} oneBook={oneBook} />
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
      </div>
    </main>
  );
}