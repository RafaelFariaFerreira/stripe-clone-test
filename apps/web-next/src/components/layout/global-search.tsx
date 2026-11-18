'use client';

import {
  applySearchSuggestion,
  buildSearchDropdown,
  formatMoney,
  formatShortDay,
  STATUS_META,
  type SearchOption,
  type StatusIcon,
} from '@stripe-clone/domain';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { IconButton } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { prefetchPaymentDetails, usePayments } from '@/features/payments/api/queries';
import type { IconName } from '@stripe-clone/icons';

const LISTBOX_ID = 'global-search-listbox';

const STATUS_ICON: Readonly<Record<StatusIcon, IconName>> = {
  check: 'status-check',
  cross: 'status-cross',
  blocked: 'status-blocked',
  refund: 'status-refund',
  clock: 'status-clock',
  alert: 'status-alert',
};

/**
 * Top-bar search, modelled on the Dashboard's:
 * - on focus it suggests filters (`is:`, `last4:`, `date:`, `email:`, `status:`, `profile:`), with
 *   "View more filters" revealing the rest;
 * - while typing it completes filter keys and values, previews up to 8 matching payments and offers
 *   "Show only payment results for …";
 * - Enter (or "View all results") applies the query to the Payments table through `?q=`, so the
 *   search is bookmarkable; picking a payment opens its details. Press `/` anywhere to focus it.
 *
 * The dropdown content comes from `buildSearchDropdown` in the shared domain package.
 */
export function GlobalSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { payments } = usePayments();

  const urlValue = pathname === '/payments' ? (searchParams.get('q') ?? '') : '';
  const [value, setValue] = useState(urlValue);
  const [syncedUrlValue, setSyncedUrlValue] = useState(urlValue);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Adopt URL changes made elsewhere (Clear all, back button) during render, as React recommends.
  if (urlValue !== syncedUrlValue) {
    setSyncedUrlValue(urlValue);
    setValue(urlValue);
  }

  const dropdown = useMemo(() => buildSearchDropdown(value, payments, expanded), [value, payments, expanded]);
  const activeOption = activeIndex >= 0 ? dropdown.options[activeIndex] : undefined;

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.closest('input, textarea, select, [contenteditable="true"]');
      if (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Keep the highlighted option visible while navigating with the keyboard.
  useEffect(() => {
    if (activeOption) document.getElementById(activeOption.id)?.scrollIntoView({ block: 'nearest' });
  }, [activeOption]);

  const update = (next: string) => {
    setValue(next);
    setActiveIndex(-1);
    setOpen(true);
  };

  /** Applies the query to the Payments table (`?q=`), keeping the other list filters. */
  const applyToTable = (query: string) => {
    const params = new URLSearchParams(pathname === '/payments' ? searchParams.toString() : '');
    if (query.trim()) params.set('q', query.trim());
    else params.delete('q');
    params.delete('page');
    const url = `/payments${params.size ? `?${params.toString()}` : ''}`;
    if (pathname === '/payments') router.replace(url, { scroll: false });
    else router.push(url);
    setOpen(false);
    inputRef.current?.blur();
  };

  const select = (option: SearchOption) => {
    switch (option.kind) {
      case 'filter':
        update(applySearchSuggestion(value, option.filter.key, 'filter'));
        break;
      case 'value':
        update(applySearchSuggestion(value, option.suggestion.token, 'value'));
        break;
      case 'toggle-filters':
        setExpanded((current) => !current);
        setActiveIndex(-1);
        break;
      case 'apply':
      case 'view-all':
        applyToTable(option.query);
        break;
      case 'payment':
        setOpen(false);
        router.push(`/payments/${option.payment.id}`);
        break;
    }
    inputRef.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const count = dropdown.options.length;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setOpen(true);
        setActiveIndex((index) => (index + 1) % count);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setOpen(true);
        setActiveIndex((index) => (index <= 0 ? count - 1 : index - 1));
        break;
      case 'Enter':
        event.preventDefault();
        if (open && activeOption) select(activeOption);
        else applyToTable(value);
        break;
      case 'Escape':
        if (open) {
          event.preventDefault();
          setOpen(false);
        } else if (value) {
          event.preventDefault();
          update('');
          setOpen(false);
        }
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  };

  const renderOption = (option: SearchOption) => (
    <div
      key={option.id}
      id={option.id}
      role="option"
      aria-selected={activeOption?.id === option.id}
      className="search-option"
      // Highlight follows real pointer movement only, so options re-rendering under a resting
      // cursor never steal the highlight from the keyboard.
      onMouseMove={() => {
        const index = dropdown.options.indexOf(option);
        if (index === activeIndex) return;
        setActiveIndex(index);
        if (option.kind === 'payment') prefetchPaymentDetails(queryClient, option.payment.id);
      }}
      onClick={() => select(option)}
    >
      <div className="search-option__card">
        <OptionContent option={option} />
      </div>
    </div>
  );

  const footer = dropdown.footer;

  return (
    <form
      role="search"
      className="global-search"
      onSubmit={(event) => {
        event.preventDefault();
        applyToTable(value);
      }}
    >
      <Icon name="search" size={12} />
      <label htmlFor="global-search" className="sr-only">
        Search payments
      </label>
      <input
        ref={inputRef}
        id="global-search"
        name="q"
        type="search"
        className="global-search__input"
        placeholder="Search"
        autoComplete="off"
        spellCheck={false}
        role="combobox"
        aria-expanded={open}
        aria-controls={LISTBOX_ID}
        aria-autocomplete="list"
        aria-activedescendant={open && activeOption ? activeOption.id : undefined}
        value={value}
        onChange={(event) => update(event.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      {value ? (
        <IconButton
          icon="close"
          label="Clear search"
          size="sm"
          className="global-search__clear"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            update('');
            if (urlValue) applyToTable('');
            inputRef.current?.focus();
          }}
        />
      ) : null}

      {open ? (
        // Keep focus in the input while clicking inside the dropdown.
        <div
          id={LISTBOX_ID}
          role="listbox"
          aria-label="Search suggestions"
          className="search-popover"
          onMouseDown={(event) => event.preventDefault()}
        >
          <div className="search-popover__list">
            {dropdown.sections.map((section, index) => (
              <div key={section.heading ?? `section-${index}`} role="group" aria-label={section.heading ?? undefined}>
                {section.heading ? (
                  <div className="search-popover__heading" role="presentation">
                    {section.heading}
                  </div>
                ) : null}
                {section.options.length ? (
                  section.options.map(renderOption)
                ) : section.emptyText ? (
                  <p className="search-popover__empty">{section.emptyText}</p>
                ) : null}
                {section.divider ? <div className="search-popover__divider" role="separator" /> : null}
              </div>
            ))}
          </div>
          <div className="search-popover__footer">
            <button
              id={footer.id}
              type="button"
              role="option"
              aria-selected={activeOption?.id === footer.id}
              className="search-popover__footer-button"
              tabIndex={-1}
              onClick={() => select(footer)}
            >
              {footer.kind === 'toggle-filters' ? (footer.expanded ? 'View fewer filters' : 'View more filters') : 'View all results'}
            </button>
          </div>
        </div>
      ) : null}
    </form>
  );
}

/** Content of one dropdown row, by option kind. */
function OptionContent({ option }: { option: SearchOption }) {
  switch (option.kind) {
    case 'filter':
      return (
        <>
          <span className="search-option__key">{option.filter.key}:</span>
          <span className="search-option__example">{option.filter.example}</span>
          <span className="search-option__description">{option.filter.description}</span>
        </>
      );
    case 'value':
      return (
        <>
          <span className="search-option__key">{option.suggestion.key}:</span>
          <span className="search-option__example">{option.suggestion.token}</span>
        </>
      );
    case 'apply':
      return (
        <>
          <Icon name="banknote" size={16} />
          <span className="search-option__query">
            Show only payment results for <strong>{option.query}</strong>
          </span>
        </>
      );
    case 'payment': {
      const meta = STATUS_META[option.payment.status];
      return (
        <span className="search-result">
          <Badge tone={meta.tone} icon={STATUS_ICON[meta.icon]}>
            <span className="sr-only">{meta.label}</span>
          </Badge>
          <span className="search-result__amount tabular-nums">{formatMoney(option.payment.amount, option.payment.currency)}</span>
          <span className="search-result__description">{option.payment.description}</span>
          <span className="search-result__date">{formatShortDay(option.payment.created)}</span>
        </span>
      );
    }
    default:
      return null;
  }
}

/** Static stand-in rendered while search params are resolved on the client. */
export function GlobalSearchFallback() {
  return (
    <div className="global-search">
      <Icon name="search" size={12} />
      <input className="global-search__input" placeholder="Search" aria-label="Search" disabled />
    </div>
  );
}
