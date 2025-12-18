"use client"

import {
  Pagination as PaginationPrimitive,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useQueryState } from "nuqs"

type PaginationProps = {
  total: number
  page: number // 0-indexed page from API
  limit: number
}

export function Pagination({ total, page, limit }: PaginationProps) {
  const [, setPage] = useQueryState("page", { defaultValue: "0" })

  const totalPages = Math.ceil(total / limit)
  const currentPage = page + 1 // Convert to 1-indexed for display

  // Don't render if there's only one page or less
  if (totalPages <= 1) {
    return null
  }

  const handlePageChange = (displayPage: number) => {
    // Convert back to 0-indexed for API
    setPage((displayPage - 1).toString())
  }

  // Generate page numbers to display (1-indexed for UI)
  const getPageNumbers = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage > 3) {
        pages.push("ellipsis")
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push("ellipsis")
      }

      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <PaginationPrimitive>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={e => {
              e.preventDefault()
              if (currentPage > 1) {
                handlePageChange(currentPage - 1)
              }
            }}
            aria-disabled={currentPage <= 1}
            className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>

        {pageNumbers.map((pageNum, index) =>
          pageNum === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={pageNum}>
              <PaginationLink
                href="#"
                onClick={e => {
                  e.preventDefault()
                  handlePageChange(pageNum)
                }}
                isActive={pageNum === currentPage}
                className="cursor-pointer"
              >
                {pageNum}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={e => {
              e.preventDefault()
              if (currentPage < totalPages) {
                handlePageChange(currentPage + 1)
              }
            }}
            aria-disabled={currentPage >= totalPages}
            className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>
      </PaginationContent>
    </PaginationPrimitive>
  )
}
