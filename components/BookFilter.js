import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Filter, Search, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/spinner";

const SORT_OPTIONS = [
  { value: "title_asc", label: "A-Z" },
  { value: "title_desc", label: "Z-A" },
  { value: "id_desc", label: "Newest" },
  { value: "id_asc", label: "Oldest" },
  { value: "random", label: "Random" },
];

const ACCESS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "free", label: "Free" },
  { value: "premium", label: "Premium" },
];

// Mobile Filter Dialog
export function MobileFilterDialog({
  isOpen,
  onOpenChange,
  tempTitle,
  setTempTitle,
  tempSelectedTags,
  handleTempTagChange,
  tempAccess,
  setTempAccess,
  tempSort,
  setTempSort,
  tagOptions,
  onApply,
  onClear,
  onReset,
  activeFiltersCount,
  loading,
}) {
  return (
    <div className="sticky top-11 z-30 lg:hidden my-2 bg-background py-1">
      <div className="flex items-center gap-4">
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogTrigger asChild>
            <Button
              variant="default"
              onClick={() => {
                onReset();
                onOpenChange(true);
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
              <div className="flex flex-col gap-2">
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
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih akses..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCESS_OPTIONS.map((option) => (
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
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Urutkan..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={onClear}>
                Clear All
              </Button>
              <Button onClick={onApply}>
                Apply Filters
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {loading && <LoadingSpinner />}
      </div>
    </div>
  );
}

// Active Filters Badges Display
export function ActiveFiltersBadges({
  selectedTags,
  title,
  access,
  sort,
  tagOptions,
  onRemoveTag,
  onRemoveTitle,
  onRemoveAccess,
  onRemoveSort,
}) {
  const hasActiveFilters = selectedTags.length > 0 || title || sort !== "title_asc" || access !== "all";

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {selectedTags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="text-xs flex items-center gap-1"
        >
          Tag: {tagOptions.find(t => t.value === tag)?.label || tag}
          <X
            className="h-3 w-3 cursor-pointer hover:text-red-500"
            onClick={() => onRemoveTag(tag)}
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
            onClick={onRemoveTitle}
          />
        </Badge>
      )}
      {access !== "all" && (
        <Badge
          variant="secondary"
          className="text-xs flex items-center gap-1"
        >
          Access: {ACCESS_OPTIONS.find(a => a.value === access)?.label}
          <X
            className="h-3 w-3 cursor-pointer hover:text-red-500"
            onClick={onRemoveAccess}
          />
        </Badge>
      )}
      {sort !== "title_asc" && (
        <Badge
          variant="secondary"
          className="text-xs flex items-center gap-1"
        >
          Sort: {SORT_OPTIONS.find(s => s.value === sort)?.label}
          <X
            className="h-3 w-3 cursor-pointer hover:text-red-500"
            onClick={onRemoveSort}
          />
        </Badge>
      )}
    </div>
  );
}

// Desktop Sidebar Filter
export function DesktopFilterSidebar({
  tempTitle,
  setTempTitle,
  tempSelectedTags,
  handleTempTagChange,
  tempAccess,
  setTempAccess,
  tempSort,
  setTempSort,
  tagOptions,
  onApply,
}) {
  return (
    <div className="hidden lg:block w-[240px]">
      <Card className="sticky top-14 p-3 w-full flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-lg">Pencarian</span>
          <Button size="sm" onClick={onApply}>
            <Search /> Cari
          </Button>
        </div>

        <div>
          <div className="text-sm font-medium">
            Cari Judul Buku
          </div>
          <Input
            id="book-title"
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
              <Label className="mb-1.5">{tagGroup.name}</Label>

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
                          id={`sidebar-tag-${tag}`}
                          checked={tempSelectedTags.includes(tag)}
                          onCheckedChange={(checked) => handleTempTagChange(tag, checked)}
                        />
                        <Label
                          htmlFor={`sidebar-tag-${tag}`}
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
              {ACCESS_OPTIONS.map((option) => (
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
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>
    </div>
  );
}

// Export constants for use in parent components
export { SORT_OPTIONS, ACCESS_OPTIONS };
