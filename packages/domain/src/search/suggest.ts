import {
  ALL_SEARCH_FILTERS,
  SEARCH_FILTER_VALUES,
  SUGGESTED_SEARCH_FILTERS,
  isSearchFilterKey,
  type SearchFilterDoc,
  type SearchFilterKey,
} from './catalog';

/** A value completion such as `status:failed`. */
export interface SearchValueSuggestion {
  key: SearchFilterKey;
  value: string;
  /** Full token inserted into the input. */
  token: string;
}

export interface SearchSuggestions {
  /** Filter keys to offer (chip + example + description). */
  filters: readonly SearchFilterDoc[];
  /** Values for the filter being typed (`status:fa` → `status:failed`). */
  values: readonly SearchValueSuggestion[];
}

/** The token under construction: everything after the last unquoted space. */
export function activeSearchToken(input: string): string {
  let quoted = false;
  let start = 0;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (char === '"') quoted = !quoted;
    else if (!quoted && char !== undefined && /\s/.test(char)) start = index + 1;
  }
  return input.slice(start);
}

/**
 * What the dropdown suggests for the current input:
 * - empty input: the six Dashboard suggestions (or every filter when expanded);
 * - a bare word that prefixes a key (`sta`): the matching filters;
 * - `key:partial` for a filter with known values: the matching values.
 */
export function getSearchSuggestions(input: string, expanded = false): SearchSuggestions {
  if (!input.trim()) return { filters: expanded ? ALL_SEARCH_FILTERS : SUGGESTED_SEARCH_FILTERS, values: [] };

  const token = activeSearchToken(input);
  const negation = token.startsWith('-') ? '-' : '';
  const body = token.slice(negation.length).toLowerCase();
  if (!body) return { filters: [], values: [] };

  const keyed = /^([a-z_0-9]+):(.*)$/.exec(body);
  if (keyed) {
    const [, key = '', partial = ''] = keyed;
    if (!isSearchFilterKey(key)) return { filters: [], values: [] };
    const values = (SEARCH_FILTER_VALUES[key] ?? [])
      .filter((value) => value.replace(/"/g, '').startsWith(partial.replace(/"/g, '')) && value !== partial)
      .map((value) => ({ key, value, token: `${negation}${key}:${value}` }));
    return { filters: [], values };
  }

  const filters = ALL_SEARCH_FILTERS.filter((filter) => filter.key.startsWith(body) && filter.key !== body);
  return { filters, values: [] };
}

/**
 * Replaces the token being typed with a completion. Filters insert `key:`
 * (ready for a value); values insert the full token followed by a space.
 */
export function applySearchSuggestion(input: string, completion: string, kind: 'filter' | 'value'): string {
  const token = activeSearchToken(input);
  const negation = token.startsWith('-') && kind === 'filter' ? '-' : '';
  const head = input.slice(0, input.length - token.length);
  return kind === 'filter' ? `${head}${negation}${completion}:` : `${head}${completion} `;
}
