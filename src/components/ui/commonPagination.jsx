import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const DataPagination = ({
  page = 1,
  limit = 10,
  total = 0,
  totalPages = 1,
  onPageChange,
  onLimitChange,
}) => {
  // if (!total || totalPages <= 1) return null;

  // 🚀 Internal strict number normalization (fixes string concatenation bugs)
  const numPage = Number(page) || 1;
  const numLimit = Number(limit) || 10;
  const numTotal = Number(total) || 0;
  const numTotalPages = Math.max(
    1,
    Number(totalPages) || Math.ceil(numTotal / numLimit) || 1,
  );

  const start = numTotal > 0 ? (numPage - 1) * numLimit + 1 : 0;
  const end = Math.min(numPage * numLimit, numTotal);

  const getPages = () => {
    const pages = [];
    const siblingCount = 1; // how many pages around current
    const totalNumbers = siblingCount * 2 + 5; // first + last + current + siblings + 2 dots

    if (numTotalPages <= totalNumbers) {
      // small number of pages → show all
      for (let i = 1; i <= numTotalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    const leftSibling = Math.max(numPage - siblingCount, 1);
    const rightSibling = Math.min(numPage + siblingCount, numTotalPages);

    const showLeftDots = leftSibling > 2;
    const showRightDots = rightSibling < numTotalPages - 1;

    if (!showLeftDots && showRightDots) {
      // left side no dots
      for (let i = 1; i <= 3 + 2 * siblingCount; i++) {
        pages.push(i);
      }
      pages.push("...");
      pages.push(numTotalPages);
    } else if (showLeftDots && !showRightDots) {
      pages.push(1);
      pages.push("...");
      for (
        let i = numTotalPages - (3 + 2 * siblingCount) + 1;
        i <= numTotalPages;
        i++
      ) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      pages.push("...");
      for (let i = leftSibling; i <= rightSibling; i++) {
        pages.push(i);
      }
      pages.push("...");
      pages.push(numTotalPages);
    }

    return pages;
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-3 mt-5 border-t pt-4">
      {/* Left: Range + Limit */}
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <span>
          Showing <span className="font-medium">{start}</span>–
          <span className="font-medium">{end}</span> of{" "}
          <span className="font-medium">{numTotal}</span>
        </span>

        {/* Limit Selector */}
        <Select
          value={String(numLimit)}
          onValueChange={(val) => onLimitChange?.(Number(val))}
        >
          <SelectTrigger className="w-[80px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[5, 10, 20, 50].map((l) => (
              <SelectItem key={l} value={String(l)}>
                {l} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Right: Pagination Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          disabled={numPage <= 1}
          onClick={() => onPageChange?.(numPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getPages().map((p, idx) =>
          p === "..." ? (
            <span
              key={`dots-${idx}`}
              className="px-2 text-gray-400 text-sm select-none"
            >
              ...
            </span>
          ) : (
            <Button
              key={`page-btn-${p}-${idx}`} // Unique key to avoid DOM duplication conflicts
              variant={Number(p) === numPage ? "default" : "outline"}
              size="sm"
              className="min-w-[36px]"
              onClick={() => onPageChange?.(Number(p))}
            >
              {p}
            </Button>
          ),
        )}

        <Button
          variant="outline"
          size="icon"
          disabled={numPage >= numTotalPages}
          onClick={() => onPageChange?.(numPage + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default DataPagination;
