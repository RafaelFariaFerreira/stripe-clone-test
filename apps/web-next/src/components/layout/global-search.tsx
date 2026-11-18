'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { IconButton } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

const DEBOUNCE_MS = 200;

/**
 * Top-bar search. On the Payments page it filters the table by payment ID,
 * customer email or last 4 digits (URL param `q`); elsewhere, Enter opens the
 * Payments page with the term applied. Press `/` anywhere to focus it.
 */
export function GlobalSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlValue = pathname === '/payments' ? (searchParams.get('q') ?? '') : '';
  const [value, setValue] = useState(urlValue);
  const [syncedUrlValue, setSyncedUrlValue] = useState(urlValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Adopt URL changes made elsewhere (Clear all, back button) during render, as
  // React recommends, without clobbering in-progress typing (e.g. a trailing space).
  if (urlValue !== syncedUrlValue) {
    setSyncedUrlValue(urlValue);
    if (urlValue !== value.trim()) setValue(urlValue);
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
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

  useEffect(() => () => clearTimeout(timer.current), []);

  const apply = (term: string, mode: 'replace' | 'push') => {
    const params = new URLSearchParams(pathname === '/payments' ? searchParams.toString() : '');
    if (term.trim()) params.set('q', term.trim());
    else params.delete('q');
    params.delete('page');
    const url = `/payments${params.size ? `?${params.toString()}` : ''}`;
    if (mode === 'push') router.push(url);
    else router.replace(url, { scroll: false });
  };

  const onChange = (next: string) => {
    setValue(next);
    clearTimeout(timer.current);
    if (pathname === '/payments') {
      timer.current = setTimeout(() => apply(next, 'replace'), DEBOUNCE_MS);
    }
  };

  return (
    <form
      role="search"
      className="global-search"
      onSubmit={(event) => {
        event.preventDefault();
        clearTimeout(timer.current);
        apply(value, pathname === '/payments' ? 'replace' : 'push');
      }}
    >
      <Icon name="search" size={12} />
      <label htmlFor="global-search" className="sr-only">
        Search payments by ID, email or last 4 digits
      </label>
      <input
        ref={inputRef}
        id="global-search"
        type="search"
        className="global-search__input"
        placeholder="Search"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && value) {
            event.preventDefault();
            onChange('');
          }
        }}
      />
      {value ? (
        <IconButton
          icon="close"
          label="Clear search"
          size="sm"
          className="global-search__clear"
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
        />
      ) : null}
    </form>
  );
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
