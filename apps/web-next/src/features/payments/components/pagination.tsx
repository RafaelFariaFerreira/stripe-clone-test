'use client';

import { PAGE_SIZES, type PageSize, type QueryResult } from '@stripe-clone/domain';

interface PaginationProps {
  result: Pick<QueryResult<unknown>, 'page' | 'pageCount' | 'total' | 'rangeStart' | 'rangeEnd'>;
  pageSize: PageSize;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSize) => void;
}

const number = new Intl.NumberFormat('en-US');

/** "Viewing 1–25 of 600 results", rows-per-page select and Previous / Next. */
export function Pagination({ result, pageSize, onPageChange, onPageSizeChange }: PaginationProps) {
  return (
    <nav className="pagination" aria-label="Pagination">
      <p className="pagination__summary" aria-live="polite">
        Viewing{' '}
        <strong>
          {number.format(result.rangeStart)}–{number.format(result.rangeEnd)}
        </strong>{' '}
        of <strong>{number.format(result.total)}</strong> results
      </p>
      <div className="pagination__controls">
        <label className="pagination__page-size">
          Rows per page
          <select
            name="page-size"
            className="select select--sm"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value) as PageSize)}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="button button--secondary button--sm"
          disabled={result.page <= 1}
          onClick={() => onPageChange(result.page - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className="button button--secondary button--sm"
          disabled={result.page >= result.pageCount}
          onClick={() => onPageChange(result.page + 1)}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
