"use client";

import React, { useState } from "react";
import { Play, Pause, Volume2, VolumeX, Music } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(70);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (val === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  return (
    <div
      className="relative flex items-center gap-3 bg-espresso/80 hover:bg-espresso/90 text-cream backdrop-blur-md rounded-full px-3.5 py-1.5 border border-cream/15 shadow-floating transition-all duration-200"
      onMouseEnter={() => setShowVolumeSlider(true)}
      onMouseLeave={() => setShowVolumeSlider(false)}
    >
      {/* Visualizer / Note Icon */}
      <div className="flex items-center gap-1 pl-0.5">
        <Music className="w-3.5 h-3.5 text-caramel" />
        {isPlaying ? (
          <div className="flex items-end gap-0.5 h-3.5 w-3">
            <span className="w-0.5 h-full bg-caramel rounded-full animate-[pulse_0.6s_ease-in-out_infinite]" />
            <span className="w-0.5 h-2 bg-caramel rounded-full animate-[pulse_0.8s_ease-in-out_infinite_0.2s]" />
            <span className="w-0.5 h-3 bg-caramel rounded-full animate-[pulse_0.7s_ease-in-out_infinite_0.4s]" />
          </div>
        ) : null}
      </div>

      {/* Track info */}
      <div className="flex flex-col pr-1">
        <span className="text-[11px] font-medium tracking-wide text-cream whitespace-nowrap">
          {BRAND.soundtrackTitle}
        </span>
        <span className="text-[9px] text-cream/60">
          {isPlaying ? (isMuted ? "Muted" : `Playing • ${volume}%`) : "Paused"}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 border-l border-cream/20 pl-2">
        {/* Play / Pause */}
        <button
          type="button"
          onClick={togglePlay}
          className="p-1 rounded-full text-cream hover:text-caramel transition-colors focus:outline-none"
          aria-label={isPlaying ? "Pause music" : "Play music"}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
        </button>

        {/* Mute toggle */}
        <button
          type="button"
          onClick={toggleMute}
          className="p-1 rounded-full text-cream hover:text-caramel transition-colors focus:outline-none"
          aria-label={isMuted ? "Unmute sound" : "Mute sound"}
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-3.5 h-3.5" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Volume Slider Drawer */}
        {showVolumeSlider && (
          <div className="flex items-center pl-1 pr-1 transition-all duration-200">
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-cream/30 rounded-lg appearance-none cursor-pointer accent-caramel"
              aria-label="Volume slider"
            />
          </div>
        )}
      </div>
    </div>
  );
}
