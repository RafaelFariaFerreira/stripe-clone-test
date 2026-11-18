import type { Payment } from '../types';
import type { SearchFilterDoc } from './catalog';
import { searchPayments } from './query';
import { getSearchSuggestions, type SearchValueSuggestion } from './suggest';

/** Every selectable row of the search dropdown. */
export type SearchOption =
  | { id: string; kind: 'filter'; filter: SearchFilterDoc }
  | { id: string; kind: 'value'; suggestion: SearchValueSuggestion }
  | { id: string; kind: 'apply'; query: string }
  | { id: string; kind: 'payment'; payment: Payment }
  | { id: string; kind: 'toggle-filters'; expanded: boolean }
  | { id: string; kind: 'view-all'; query: string };

export interface SearchSection {
  /** `null` renders the options without a heading (the "Show only…" row). */
  heading: string | null;
  options: SearchOption[];
  /** Shown instead of options when the section is empty. */
  emptyText?: string;
  /** Draw a divider after the section. */
  divider?: boolean;
}

export interface SearchDropdown {
  sections: SearchSection[];
  /** Footer action ("View more filters" / "View all results"). */
  footer: SearchOption;
  /** Sections' options followed by the footer: the keyboard order. */
  options: SearchOption[];
}

/** Results shown inline in the dropdown, like the Dashboard. */
export const SEARCH_RESULT_LIMIT = 8;

/**
 * Builds the dropdown for the current input. Framework-agnostic: both apps
 * render this model and only map option kinds to actions.
 */
export function buildSearchDropdown(
  input: string,
  payments: readonly Payment[] | undefined,
  expanded: boolean,
  now: Date = new Date(),
): SearchDropdown {
  const query = input.trim();
  const suggestions = getSearchSuggestions(input, expanded);
  const sections: SearchSection[] = [];

  if (!query) {
    sections.push({
      heading: 'Suggested filters',
      options: suggestions.filters.map((filter) => ({ id: `search-filter-${filter.key}`, kind: 'filter', filter })),
    });
    const footer: SearchOption = { id: 'search-toggle-filters', kind: 'toggle-filters', expanded };
    return { sections, footer, options: [...sections.flatMap((section) => section.options), footer] };
  }

  sections.push({ heading: null, options: [{ id: 'search-apply', kind: 'apply', query }], divider: true });

  if (suggestions.values.length) {
    sections.push({
      heading: 'Suggested values',
      options: suggestions.values.map((suggestion) => ({ id: `search-value-${suggestion.token}`, kind: 'value', suggestion })),
    });
  } else if (suggestions.filters.length) {
    sections.push({
      heading: 'Suggested filters',
      options: suggestions.filters.map((filter) => ({ id: `search-filter-${filter.key}`, kind: 'filter', filter })),
    });
  }

  if (payments) {
    const results = searchPayments(payments, query, SEARCH_RESULT_LIMIT, now);
    sections.push({
      heading: 'Payments',
      options: results.map((payment) => ({ id: `search-payment-${payment.id}`, kind: 'payment', payment })),
      emptyText: 'No payments match this search.',
    });
  }

  const footer: SearchOption = { id: 'search-view-all', kind: 'view-all', query };
  return { sections, footer, options: [...sections.flatMap((section) => section.options), footer] };
}
