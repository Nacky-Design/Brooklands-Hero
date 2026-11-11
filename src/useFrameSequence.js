import { useCallback, useEffect, useRef, useState } from 'react';
import manifest from './sequenceManifest.json';
import { presetFrameFile } from './presets.js';

export const FRAME_COUNT = manifest.frames.length;
export const frameURL = (index, preset = 'silver') => `${import.meta.env.BASE_URL}${presetFrameFile(index, preset)}`;
export const wrapFrame = index => ((index % FRAME_COUNT) + FRAME_COUNT) % FRAME_COUNT;

export function useFrameSequence() {
  const cache = useRef(new Map());
  const controller = useRef(null);
  const alive = useRef(false);
  const request = useRef(0);
  // Both rotation and material changes update the same intent. A late response
  // can never commit an older material or angle over the latest user choice.
  const intent = useRef({ index: 0, preset: 'silver' });
  const [state, setState] = useState({ frame: null, requested: 0, requestedPreset: 'silver', buffering: true, error: null });
  const [counts, setCounts] = useState({});

  const loadBytes = useCallback((index, preset, retry = false) => {
    const entries = cache.current, key = `${preset}:${index}`;
    if (retry && entries.get(key)?.status === 'failed') entries.delete(key);
    if (entries.has(key)) return entries.get(key).promise;
    const abort = controller.current;
    const record = { preset, status: 'loading', url: null, promise: null };
    record.promise = (async () => {
      try {
        const response = await fetch(frameURL(index, preset), { signal: abort.signal, cache: retry ? 'reload' : 'force-cache' });
        if (!response.ok) throw new Error(`Frame ${preset}/${index}: HTTP ${response.status}`);
        const blob = await response.blob();
        if (abort.signal.aborted) throw new DOMException('Aborted', 'AbortError');
        record.url = URL.createObjectURL(blob);
        record.status = 'loaded';
        if (alive.current && cache.current === entries) setCounts(previous => ({ ...previous, [preset]: [...entries.values()].filter(entry => entry.preset === preset && entry.status === 'loaded').length }));
        return record.url;
      } catch (error) { record.status = 'failed'; throw error; }
    })();
    entries.set(key, record);
    return record.promise;
  }, []);

  const select = useCallback(async (value, retry = false, preset = intent.current.preset) => {
    const index = wrapFrame(value), version = ++request.current;
    intent.current = { index, preset };
    setState(previous => ({ ...previous, requested: index, requestedPreset: preset, buffering: true, error: null }));
    try {
      const url = await loadBytes(index, preset, retry);
      if (!alive.current || version !== request.current) return;
      const image = new Image(); image.decoding = 'async'; image.src = url;
      await image.decode();
      if (!alive.current || version !== request.current) return;
      // Commit frame, material and active card together only after decoding.
      setState({ frame: { index, preset, url }, requested: index, requestedPreset: preset, buffering: false, error: null });
    } catch (error) {
      if (!alive.current || version !== request.current || error.name === 'AbortError') return;
      if (error.name === 'EncodingError') {
        const key = `${preset}:${index}`, record = cache.current.get(key);
        if (record?.url) URL.revokeObjectURL(record.url);
        cache.current.delete(key);
      }
      setState(previous => ({ ...previous, buffering: false, error: true }));
    }
  }, [loadBytes]);

  useEffect(() => {
    alive.current = true; controller.current = new AbortController(); select(0, false, 'silver');
    return () => {
      alive.current = false; request.current++; controller.current.abort();
      for (const record of cache.current.values()) if (record.url) URL.revokeObjectURL(record.url);
      cache.current.clear();
    };
  }, [select]);

  const readyPreset = state.frame?.preset;
  useEffect(() => {
    if (!readyPreset) return;
    let stopped = false;
    const queue = [], centre = intent.current.index;
    for (let distance = 1; distance <= Math.ceil(FRAME_COUNT / 2); distance++) {
      for (const index of [wrapFrame(centre + distance), wrapFrame(centre - distance)]) if (index !== centre && !queue.includes(index)) queue.push(index);
    }
    const worker = async () => {
      while (!stopped && queue.length) {
        try { await loadBytes(queue.shift(), readyPreset); } catch { /* Retry on selection. */ }
      }
    };
    // Two workers for the active palette; cache compressed blobs, not 99 decoded images.
    Promise.all([worker(), worker()]);
    return () => { stopped = true; };
  }, [readyPreset, loadBytes]);

  return { ...state, loaded: counts[state.frame?.preset || 'silver'] || 0, loadedByPreset: counts, select, retry: () => select(state.requested, true, state.requestedPreset) };
}
