import { useCallback, useEffect, useRef, useState } from 'react';

export const FRAME_COUNT = 24;
export const frameURL = index => `${import.meta.env.BASE_URL}assets/turntable-v1/frame-${String(index).padStart(2, '0')}.webp`;
export const wrapFrame = index => ((index % FRAME_COUNT) + FRAME_COUNT) % FRAME_COUNT;

export function useFrameSequence() {
  const cache = useRef(new Map());
  const controller = useRef(null);
  const alive = useRef(false);
  const request = useRef(0);
  const [state, setState] = useState({ frame: null, requested: 0, buffering: true, error: null });
  const [loaded, setLoaded] = useState(0);

  // Retain compressed blobs, not a decoded Image object for every frame.
  const loadBytes = useCallback((index, retry = false) => {
    const entries = cache.current;
    if (retry && entries.get(index)?.status === 'failed') entries.delete(index);
    const existing = entries.get(index);
    if (existing) return existing.promise;
    const abort = controller.current;
    const record = { status: 'loading', url: null, promise: null };
    record.promise = (async () => {
      try {
        const response = await fetch(frameURL(index), { signal: abort.signal, cache: 'force-cache' });
        if (!response.ok) throw new Error(`Frame ${index}: HTTP ${response.status}`);
        const blob = await response.blob();
        if (abort.signal.aborted) throw new DOMException('Aborted', 'AbortError');
        record.url = URL.createObjectURL(blob);
        record.status = 'loaded';
        if (alive.current && cache.current === entries) setLoaded([...entries.values()].filter(entry => entry.status === 'loaded').length);
        return record.url;
      } catch (error) {
        record.status = 'failed';
        throw error;
      }
    })();
    entries.set(index, record);
    return record.promise;
  }, []);

  const select = useCallback(async (value, retry = false) => {
    const index = wrapFrame(value);
    const version = ++request.current;
    setState(previous => ({ ...previous, requested: index, buffering: true, error: null }));
    try {
      const url = await loadBytes(index, retry);
      if (!alive.current || version !== request.current) return;
      const image = new Image();
      image.decoding = 'async';
      image.src = url;
      await image.decode();
      if (!alive.current || version !== request.current) return;
      setState({ frame: { index, url }, requested: index, buffering: false, error: null });
    } catch (error) {
      if (!alive.current || version !== request.current || error.name === 'AbortError') return;
      // Keep the current frame visible if another angle fails.
      setState(previous => ({ ...previous, buffering: false, error: true }));
    }
  }, [loadBytes]);

  useEffect(() => {
    alive.current = true;
    controller.current = new AbortController();
    select(0);
    return () => {
      alive.current = false;
      request.current++;
      controller.current.abort();
      for (const record of cache.current.values()) if (record.url) URL.revokeObjectURL(record.url);
      cache.current.clear();
    };
  }, [loadBytes, select]);

  const ready = state.frame !== null;
  useEffect(() => {
    if (!ready) return;
    let stopped = false;
    const queue = [];
    for (let distance = 1; distance <= FRAME_COUNT / 2; distance++) {
      for (const index of [distance, FRAME_COUNT - distance]) if (!queue.includes(index)) queue.push(index);
    }
    const worker = async () => {
      while (!stopped && queue.length) {
        const index = queue.shift();
        try { await loadBytes(index); } catch { /* A selected failed frame offers retry. */ }
      }
    };
    // Start only after the first decoded frame is visible. Resume after initial-load retry.
    Promise.all([worker(), worker()]);
    return () => { stopped = true; };
  }, [ready, loadBytes]);

  return { ...state, loaded, select, retry: () => select(state.requested, true) };
}
