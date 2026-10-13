"use client";

import { useEffect, useRef } from "react";
import { updateQuantity } from "../api/cart.client";
import type { CartData } from "../types";

/** Wait this long after the last click on an item before sending, so a burst of clicks is one request. */
const DEBOUNCE_MS = 350;
/** Retry delay when the previous request for the same item is still in flight. */
const BUSY_RETRY_MS = 100;

interface QuantityUpdatesOptions {
  /** The quantity currently shown for an item, or undefined if the item is gone. */
  getQuantity: (itemId: string) => number | undefined;
  /** Show a quantity right away, before the server confirms it. */
  onOptimistic: (itemId: string, quantity: number) => void;
  /** The server refused: show the last confirmed quantity again. */
  onRollback: (itemId: string, quantity: number) => void;
  /** Everything has settled: here is the server's full cart. */
  onServerCart: (cart: CartData) => void;
  onError: (message: string) => void;
}

/**
 * Makes "+" and "-" feel instant. The screen changes on every click; the request is sent once the
 * clicks stop (debounced per item), and the buttons are never blocked while it runs.
 * The server's cart replaces ours only when no item has a pending or running update,
 * so a late answer can never overwrite a newer click.
 */
export function useQuantityUpdates(options: QuantityUpdatesOptions) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  /** Last quantity the server confirmed, per item. A failed update rolls back to it. */
  const confirmed = useRef(new Map<string, number>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const inFlight = useRef(new Map<string, Promise<void>>());

  const isIdle = () => timers.current.size === 0 && inFlight.current.size === 0;

  const send = async (itemId: string, quantity: number) => {
    const result = await updateQuantity(itemId, quantity);
    inFlight.current.delete(itemId);

    if (result.ok) {
      confirmed.current.set(itemId, quantity);
      if (isIdle()) {
        confirmed.current.clear();
        optionsRef.current.onServerCart(result.cart);
      }
      return;
    }

    // Drop any newer click on this item: it was based on a quantity the server did not accept.
    clearTimeout(timers.current.get(itemId));
    timers.current.delete(itemId);
    const previous = confirmed.current.get(itemId);
    confirmed.current.delete(itemId);
    if (previous !== undefined) optionsRef.current.onRollback(itemId, previous);
    optionsRef.current.onError(result.message);
  };

  const run = async (itemId: string): Promise<void> => {
    timers.current.delete(itemId);

    if (inFlight.current.has(itemId)) {
      schedule(itemId, BUSY_RETRY_MS); // one request per item at a time
      return;
    }

    const quantity = optionsRef.current.getQuantity(itemId);
    if (quantity === undefined || quantity === confirmed.current.get(itemId)) return;

    const request = send(itemId, quantity);
    inFlight.current.set(itemId, request);
    await request;
  };

  function schedule(itemId: string, delay: number) {
    clearTimeout(timers.current.get(itemId));
    timers.current.set(
      itemId,
      setTimeout(() => void run(itemId), delay),
    );
  }

  /** Call on every "+" or "-" click. `current` is the quantity shown before the click. */
  const change = (itemId: string, current: number, next: number) => {
    if (!confirmed.current.has(itemId)) confirmed.current.set(itemId, current);
    optionsRef.current.onOptimistic(itemId, next);
    schedule(itemId, DEBOUNCE_MS);
  };

  /**
   * Sends every waiting update now and waits for all running ones. Used before the cart is
   * replaced by a removal, so that no quantity the user chose is lost. Updates for `skipIds`
   * (items about to be removed) are dropped.
   */
  const flushAll = async (skipIds: ReadonlySet<string> = new Set()) => {
    for (const itemId of [...timers.current.keys()]) {
      clearTimeout(timers.current.get(itemId));
      timers.current.delete(itemId);
      if (skipIds.has(itemId)) confirmed.current.delete(itemId);
      else await run(itemId);
    }
    await Promise.all(inFlight.current.values());
  };

  // Leaving the page must not lose a click made less than a moment ago.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const itemId of [...pending.keys()]) {
        clearTimeout(pending.get(itemId));
        void run(itemId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { change, flushAll };
}
