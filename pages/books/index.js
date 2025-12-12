import cabocilAPI from "@/apis/cabocil_api";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import BookCard from "@/components/BookCard";
import {
  MobileFilterDialog,
  ActiveFiltersBadges,
  DesktopFilterSidebar,
  SORT_OPTIONS,
  ACCESS_OPTIONS
} from "@/components/BookFilter";

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

  // Temporary filter states for modal (before applying)
  const [tempSelectedTypes, setTempSelectedTypes] = useState(["default"]);
  const [tempSelectedTags, setTempSelectedTags] = useState([]);
  const [tempTitle, setTempTitle] = useState("");
  const [tempSort, setTempSort] = useState("title_asc");
  const [tempAccess, setTempAccess] = useState("all");
  const [now, setNow] = useState(0);

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

    if (access === "free") {
      params.access = "free";
    } else if (access === "premium") {
      params.exclude_access = "free";
    }

    GetBookList(params);
  }, [selectedTypes, selectedTags, title, sort, access, now]);

  useEffect(() => {
    setSort(tempSort);
    setAccess(tempAccess);
  }, [tempSort, tempAccess]);

  async function GetBookList(params) {
    setLoading(true);
    try {
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
        setTagOptions(body.data.tag_group);
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
    setNow(new Date());
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

  const activeFiltersCount = selectedTags.length + (title ? 1 : 0) + (sort !== "title_asc" ? 1 : 0) + (access !== "all" ? 1 : 0);

  return (
    <main className="">
      {/* Mobile Filter Dialog */}
      <MobileFilterDialog
        isOpen={isFilterModalOpen}
        onOpenChange={setIsFilterModalOpen}
        tempTitle={tempTitle}
        setTempTitle={setTempTitle}
        tempSelectedTags={tempSelectedTags}
        handleTempTagChange={handleTempTagChange}
        tempAccess={tempAccess}
        setTempAccess={setTempAccess}
        tempSort={tempSort}
        setTempSort={setTempSort}
        tagOptions={tagOptions}
        onApply={applyFilters}
        onClear={clearFilters}
        onReset={resetTempFilters}
        activeFiltersCount={activeFiltersCount}
        loading={loading}
      />

      {/* Active Filters Badges */}
      <div className="lg:hidden">
        <ActiveFiltersBadges
          selectedTags={selectedTags}
          title={title}
          access={access}
          sort={sort}
          tagOptions={tagOptions}
          onRemoveTag={(tag) => setSelectedTags(prev => prev.filter(t => t !== tag))}
          onRemoveTitle={() => setTitle("")}
          onRemoveAccess={() => setAccess("all")}
          onRemoveSort={() => setSort("title_asc")}
        />
      </div>

      <div className="flex flex-row gap-3">
        {/* Desktop Sidebar Filter */}
        <DesktopFilterSidebar
          tempTitle={tempTitle}
          setTempTitle={setTempTitle}
          tempSelectedTags={tempSelectedTags}
          handleTempTagChange={handleTempTagChange}
          tempAccess={tempAccess}
          setTempAccess={setTempAccess}
          tempSort={tempSort}
          setTempSort={setTempSort}
          tagOptions={tagOptions}
          onApply={applyFilters}
        />

        <div className="flex-1">
          {/* Books Grid */}
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