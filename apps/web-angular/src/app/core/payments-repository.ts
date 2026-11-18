import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { detailShardOf, type PaymentDetails, type PaymentDetailsShard, type PaymentsDataset } from '@stripe-clone/domain';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { firstValueFrom } from 'rxjs';

/** Bump to invalidate every persisted entry after a data/schema change. */
const CACHE_VERSION = 'v1';
const key = (name: string) => `stripe-clone:${CACHE_VERSION}:${name}`;

/**
 * Loads the static mock dataset with three cache layers:
 *  1. in-memory promises (one request per resource per session),
 *  2. IndexedDB (instant repeat visits, survives reloads),
 *  3. HTTP caching of the `/data/*` files themselves.
 */
@Injectable({ providedIn: 'root' })
export class PaymentsRepository {
  private readonly http = inject(HttpClient);
  private dataset?: Promise<PaymentsDataset>;
  private readonly shards = new Map<number, Promise<PaymentDetailsShard>>();

  /** The whole list dataset (~36 KB gzipped). */
  loadDataset(): Promise<PaymentsDataset> {
    this.dataset ??= this.cached(key('dataset'), () => firstValueFrom(this.http.get<PaymentsDataset>('/data/payments.json')));
    // A failed request must not poison the in-memory cache.
    this.dataset.catch(() => (this.dataset = undefined));
    return this.dataset;
  }

  /** Details for one payment, loaded lazily from its shard (~1/16 of all details). */
  async loadDetails(id: string): Promise<PaymentDetails | null> {
    const shard = await this.loadShard(detailShardOf(id));
    return shard[id] ?? null;
  }

  /** Warms the shard of a payment, e.g. when the pointer rests on its row. */
  prefetchDetails(id: string): void {
    void this.loadShard(detailShardOf(id)).catch(() => undefined);
  }

  private loadShard(index: number): Promise<PaymentDetailsShard> {
    let shard = this.shards.get(index);
    if (!shard) {
      shard = this.cached(key(`details-${index}`), () => firstValueFrom(this.http.get<PaymentDetailsShard>(`/data/details/${index}.json`)));
      shard.catch(() => this.shards.delete(index));
      this.shards.set(index, shard);
    }
    return shard;
  }

  /** Cache-first read through IndexedDB; storage failures fall back to the network. */
  private async cached<T>(storageKey: string, fetcher: () => Promise<T>): Promise<T> {
    try {
      const hit = await idbGet<T>(storageKey);
      if (hit !== undefined) return hit;
    } catch {
      // IndexedDB unavailable (private mode, blocked storage): use the network.
    }
    const value = await fetcher();
    void idbSet(storageKey, value).catch(() => undefined);
    return value;
  }
}
