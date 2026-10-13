"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiResult } from "../api/checkout.client";

export type RemoteListStatus = "idle" | "loading" | "ready" | "unavailable" | "error";

export interface RemoteList<T> {
  status: RemoteListStatus;
  items: T[];
  retry: () => void;
}

/**
 * Loads a list from the backend for a modal.
 * - Pass `null` as the fetcher to do nothing (the modal is closed, or a parent is not chosen yet).
 * - It loads again whenever `key` changes, so a modal gets fresh data each time it opens.
 * - "unavailable" means the endpoint answered 404: the backend has not built it yet.
 */
export function useRemoteList<T>(fetcher: (() => Promise<ApiResult<T[]>>) | null, key: string): RemoteList<T> {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [state, setState] = useState<{ status: RemoteListStatus; items: T[] }>({ status: "idle", items: [] });
  const [attempt, setAttempt] = useState(0);
  const enabled = fetcher !== null;

  useEffect(() => {
    const load = fetcherRef.current;
    if (!load) {
      setState({ status: "idle", items: [] });
      return;
    }

    let cancelled = false;
    setState({ status: "loading", items: [] });
    void load().then((result) => {
      if (cancelled) return;
      if (result.ok) setState({ status: "ready", items: result.data });
      else setState({ status: result.status === 404 ? "unavailable" : "error", items: [] });
    });

    return () => {
      cancelled = true;
    };
  }, [key, attempt, enabled]);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);
  return { ...state, retry };
}
