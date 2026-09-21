"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { TOTAL_HERO_FRAMES, HERO_FRAME_PATH } from "@/lib/constants";

export function getFrameUrl(index: number): string {
  const frameNumber = (index + 1).toString().padStart(4, "0");
  return `${HERO_FRAME_PATH}${frameNumber}.webp`;
}

export function useHeroFrames() {
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_HERO_FRAMES).fill(null));
  const [firstFrameLoaded, setFirstFrameLoaded] = useState<boolean>(false);
  const [loadedCount, setLoadedCount] = useState<number>(0);

  useEffect(() => {
    let isCancelled = false;

    // 1. Prioritize Frame 1 to display as soon as it loads/decodes
    const firstImg = new Image();
    firstImg.src = getFrameUrl(0);

    const onFirstFrameReady = () => {
      if (isCancelled) return;
      imagesRef.current[0] = firstImg;
      setFirstFrameLoaded(true);
      setLoadedCount(1);

      // 2. Progressively preload remaining frames in background
      for (let i = 1; i < TOTAL_HERO_FRAMES; i++) {
        const img = new Image();
        img.src = getFrameUrl(i);
        img.onload = () => {
          if (isCancelled) return;
          imagesRef.current[i] = img;
          setLoadedCount((prev) => prev + 1);
        };
      }
    };

    if (firstImg.complete) {
      onFirstFrameReady();
    } else {
      firstImg.onload = onFirstFrameReady;
    }

    return () => {
      isCancelled = true;
    };
  }, []);

  /**
   * Returns the requested frame, or the closest loaded frame to avoid flickering
   */
  const getFrame = useCallback((targetIndex: number): HTMLImageElement | null => {
    const clampedIndex = Math.max(0, Math.min(TOTAL_HERO_FRAMES - 1, targetIndex));
    const exact = imagesRef.current[clampedIndex];
    if (exact) return exact;

    // Search nearest available loaded frame
    for (let offset = 1; offset < TOTAL_HERO_FRAMES; offset++) {
      const prev = clampedIndex - offset;
      if (prev >= 0 && imagesRef.current[prev]) return imagesRef.current[prev];
      const next = clampedIndex + offset;
      if (next < TOTAL_HERO_FRAMES && imagesRef.current[next]) return imagesRef.current[next];
    }

    return imagesRef.current[0] || null;
  }, []);

  return {
    imagesRef,
    firstFrameLoaded,
    loadedCount,
    totalFrames: TOTAL_HERO_FRAMES,
    getFrame,
  };
}
