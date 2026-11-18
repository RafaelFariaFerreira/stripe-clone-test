import { Button } from '@/components/ui/button';

/** Filters matched nothing. Copy is verbatim from the Dashboard. */
export function EmptyResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="state-box" role="status">
      <div>
        <p className="state-box__title">No results</p>
        <p className="state-box__description">No results match your criteria</p>
      </div>
      <Button onClick={onClear}>Clear all</Button>
    </div>
  );
}

/** The dataset failed to load. */
export function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="state-box" role="alert">
      <div>
        <p className="state-box__title">Something went wrong</p>
        <p className="state-box__description">We couldn&apos;t load your payments. Check your connection and try again.</p>
      </div>
      <Button onClick={onRetry}>Retry</Button>
    </div>
  );
}
