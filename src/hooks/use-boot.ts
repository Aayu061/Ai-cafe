"use client";

import { useState, useEffect } from "react";

export function useBoot() {
  const [isBooted, setIsBooted] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const booted = sessionStorage.getItem("ai_cafe_booted") === "true";
      setIsBooted(booted);
    }
  }, []);

  const markBooted = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("ai_cafe_booted", "true");
      setIsBooted(true);
    }
  };

  const resetBoot = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("ai_cafe_booted");
      setIsBooted(false);
    }
  };

  return {
    isBooted,
    markBooted,
    resetBoot,
  };
}

export default useBoot;
