"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useHeroFrames } from "@/hooks/use-hero-frames";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { HeroOverlay } from "./hero-overlay";
import { TOTAL_HERO_FRAMES } from "@/lib/constants";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function HeroCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { firstFrameLoaded, getFrame, loadedCount } = useHeroFrames();
  const prefersReducedMotion = useReducedMotion();
  const [scrollProgress, setScrollProgress] = useState(0);

  // Store current frame index without triggering unnecessary React renders
  const currentFrameIndexRef = useRef<number>(0);
  const targetFrameIndexRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  /**
   * Draw the specified frame to the canvas with high-DPI and aspect-ratio scaling
   */
  const renderFrame = useCallback(
    (index: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      const img = getFrame(index);
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const width = canvas.width;
      const height = canvas.height;

      // Image native dimensions: 1280 x 720 (16:9)
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;

      // Cover scaling calculation to fill viewport while preserving 16:9 aspect ratio
      const canvasRatio = width / height;
      const imgRatio = imgWidth / imgHeight;

      let drawWidth = width;
      let drawHeight = height;
      let offsetX = 0;
      let offsetY = 0;

      if (canvasRatio > imgRatio) {
        drawWidth = width;
        drawHeight = width / imgRatio;
        offsetY = (height - drawHeight) / 2;
      } else {
        drawHeight = height;
        drawWidth = height * imgRatio;
        offsetX = (width - drawWidth) / 2;
      }

      ctx.fillStyle = "#120905"; // Deep warm coffee tone background
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      currentFrameIndexRef.current = index;
    },
    [getFrame]
  );

  /**
   * Resize canvas to viewport matching devicePixelRatio
   */
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    // Re-render current frame after resize
    renderFrame(currentFrameIndexRef.current);
  }, [renderFrame]);

  // Initial resize and frame 1 draw as soon as frame 1 loads
  useEffect(() => {
    if (!firstFrameLoaded) return;

    handleResize();
    renderFrame(0);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [firstFrameLoaded, handleResize, renderFrame]);

  // ScrollTrigger Setup
  useEffect(() => {
    if (prefersReducedMotion || !firstFrameLoaded) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Animation frame render loop
    const tick = () => {
      if (currentFrameIndexRef.current !== targetFrameIndexRef.current) {
        renderFrame(targetFrameIndexRef.current);
      }
      rafIdRef.current = requestAnimationFrame(tick);
    };
    rafIdRef.current = requestAnimationFrame(tick);

    const trigger = ScrollTrigger.create({
      trigger: container,
      start: "top top",
      end: () => `+=${window.innerHeight * 2.5}`, // Pinned scroll track length for deliberate cinematic control
      pin: true,
      pinSpacing: true,
      scrub: 0.2, // Smooth interpolation for natural feel
      onUpdate: (self) => {
        const progress = self.progress;
        setScrollProgress(progress);
        const frameIndex = Math.min(
          TOTAL_HERO_FRAMES - 1,
          Math.max(0, Math.floor(progress * TOTAL_HERO_FRAMES))
        );
        targetFrameIndexRef.current = frameIndex;
      },
    });

    return () => {
      trigger.kill();
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [prefersReducedMotion, firstFrameLoaded, renderFrame]);

  return (
    <div
      id="hero"
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-[#120905]"
    >
      {/* HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Cinematic Vignette & Ambient Gradient Overlays */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#120905]/80 via-transparent to-[#120905]/40" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#120905]/40 via-transparent to-[#120905]/40" />

      {/* Hero Typography & CTA Overlay */}
      <HeroOverlay
        scrollProgress={scrollProgress}
        isReducedMotion={prefersReducedMotion}
      />

      {/* Subtle frame preloading indicator (discreet, bottom-right) */}
      {loadedCount < TOTAL_HERO_FRAMES && (
        <div className="absolute bottom-3 right-4 z-30 pointer-events-none text-[9px] text-cream/40 tracking-wider uppercase font-mono">
          Buffering experience {Math.round((loadedCount / TOTAL_HERO_FRAMES) * 100)}%
        </div>
      )}
    </div>
  );
}
