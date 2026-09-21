"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { TOTAL_HERO_FRAMES, HERO_FRAME_PATH } from "@/lib/constants";

export function getFrameUrl(index: number): string {
  const frameNumber = (index + 1).toString().padStart(4, "0");
  return `${HERO_FRAME_PATH}${frameNumber}.webp`;
}

// Max concurrent background image downloads to prevent network congestion
const MAX_CONCURRENT_DOWNLOADS = 4;

export function useHeroFrames() {
  const imagesRef = useRef<(HTMLImageElement | null)[]>(
    new Array(TOTAL_HERO_FRAMES).fill(null)
  );
  const [firstFrameLoaded, setFirstFrameLoaded] = useState<boolean>(false);
  const [loadedCount, setLoadedCount] = useState<number>(0);

  const queueRef = useRef<number[]>([]);
  const activeDownloadsRef = useRef<number>(0);
  const isCancelledRef = useRef<boolean>(false);

  // Pump the download queue up to MAX_CONCURRENT_DOWNLOADS
  const pumpQueue = useCallback(() => {
    if (isCancelledRef.current) return;
    if (activeDownloadsRef.current >= MAX_CONCURRENT_DOWNLOADS) return;
    if (queueRef.current.length === 0) return;

    const nextIndex = queueRef.current.shift();
    if (nextIndex === undefined) return;

    // If already loaded or in progress, skip to next
    if (imagesRef.current[nextIndex]) {
      pumpQueue();
      return;
    }

    activeDownloadsRef.current++;
    const img = new Image();
    img.src = getFrameUrl(nextIndex);

    const onComplete = () => {
      activeDownloadsRef.current--;
      if (!isCancelledRef.current) {
        imagesRef.current[nextIndex] = img;
        setLoadedCount((c) => c + 1);
        if (nextIndex === 0) {
          setFirstFrameLoaded(true);
        }
      }
      pumpQueue();
    };

    if (img.complete && img.naturalWidth > 0) {
      onComplete();
    } else {
      img.onload = () => {
        if ("decode" in img) {
          img.decode().then(onComplete).catch(onComplete);
        } else {
          onComplete();
        }
      };
      img.onerror = () => {
        activeDownloadsRef.current--;
        pumpQueue();
      };
    }
  }, []);

  // Dynamically reprioritize queue when user scrolls to a specific region
  const prioritizeWindow = useCallback(
    (centerIndex: number) => {
      const windowIndices: number[] = [];
      // Next 12 frames ahead of scroll
      for (
        let i = centerIndex;
        i <= Math.min(TOTAL_HERO_FRAMES - 1, centerIndex + 12);
        i++
      ) {
        if (!imagesRef.current[i]) windowIndices.push(i);
      }
      // 4 frames behind for smooth reverse scrolling
      for (let i = centerIndex - 1; i >= Math.max(0, centerIndex - 4); i--) {
        if (!imagesRef.current[i]) windowIndices.push(i);
      }

      if (windowIndices.length > 0) {
        // Prepend prioritized frames to front of queue
        queueRef.current = [
          ...windowIndices,
          ...queueRef.current.filter((idx) => !windowIndices.includes(idx)),
        ];

        while (
          activeDownloadsRef.current < MAX_CONCURRENT_DOWNLOADS &&
          queueRef.current.length > 0
        ) {
          pumpQueue();
        }
      }
    },
    [pumpQueue]
  );

  useEffect(() => {
    isCancelledRef.current = false;

    // Priority loading plan:
    // 1. Frame 0 (instant first paint)
    // 2. Initial scroll window (frames 1 to 24)
    // 3. Keyframes every 4th frame (28, 32, 36... 191) to guarantee smooth scrubbing early
    // 4. Fill in remaining intermediate frames
    const initialBatch: number[] = [0];
    for (let i = 1; i <= Math.min(24, TOTAL_HERO_FRAMES - 1); i++) {
      initialBatch.push(i);
    }

    const keyframes: number[] = [];
    for (let i = 28; i < TOTAL_HERO_FRAMES; i += 4) {
      keyframes.push(i);
    }

    const remaining: number[] = [];
    for (let i = 25; i < TOTAL_HERO_FRAMES; i++) {
      if (!keyframes.includes(i)) {
        remaining.push(i);
      }
    }

    queueRef.current = [...initialBatch, ...keyframes, ...remaining];

    // Launch worker downloads
    for (let i = 0; i < MAX_CONCURRENT_DOWNLOADS; i++) {
      pumpQueue();
    }

    return () => {
      isCancelledRef.current = true;
    };
  }, [pumpQueue]);

  /**
   * Returns the requested frame, or the closest loaded frame to avoid flickering
   */
  const getFrame = useCallback(
    (targetIndex: number): HTMLImageElement | null => {
      const clampedIndex = Math.max(0, Math.min(TOTAL_HERO_FRAMES - 1, targetIndex));
      const exact = imagesRef.current[clampedIndex];
      if (exact && exact.complete && exact.naturalWidth > 0) return exact;

      // Proactively bump surrounding frames to top of queue
      prioritizeWindow(clampedIndex);

      // Search nearest available loaded frame
      for (let offset = 1; offset < TOTAL_HERO_FRAMES; offset++) {
        const prev = clampedIndex - offset;
        if (
          prev >= 0 &&
          imagesRef.current[prev]?.complete &&
          (imagesRef.current[prev]?.naturalWidth || 0) > 0
        ) {
          return imagesRef.current[prev];
        }
        const next = clampedIndex + offset;
        if (
          next < TOTAL_HERO_FRAMES &&
          imagesRef.current[next]?.complete &&
          (imagesRef.current[next]?.naturalWidth || 0) > 0
        ) {
          return imagesRef.current[next];
        }
      }

      return imagesRef.current[0] || null;
    },
    [prioritizeWindow]
  );

  return {
    imagesRef,
    firstFrameLoaded,
    loadedCount,
    totalFrames: TOTAL_HERO_FRAMES,
    getFrame,
    prioritizeWindow,
  };
}
