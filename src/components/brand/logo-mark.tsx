import React from "react";

interface LogoMarkProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  sparkleColor?: string;
  glassColor?: string;
  liquidColor?: string;
}

/**
 * AI CAFÉ — Official Logo Mark
 * Refined cold-brew glassware silhouette harmonized with a subtle 4-pointed intelligence spark.
 * Minimalist, editorial, scalable down to 16x16 favicon size and crisp up to hero scale.
 */
export function LogoMark({
  size = 32,
  sparkleColor = "#C98A4A",
  glassColor = "currentColor",
  liquidColor = "#C98A4A",
  className = "",
  ...props
}: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Precision Cold-Brew Glassware Outer Contour */}
      <path
        d="M13 10H33L30.8 35.2C30.6 37.8 28.5 39.8 25.9 39.8H20.1C17.5 39.8 15.4 37.8 15.2 35.2L13 10Z"
        stroke={glassColor}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Internal Cold-Brew Liquid Layer with Artisan Wave */}
      <path
        d="M14.8 20C17.5 19.2 20.8 21.2 24.5 20.8C27.5 20.5 29.8 19.4 31.2 20L29.6 34.5C29.5 35.8 28.4 36.8 27.1 36.8H20.9C19.6 36.8 18.5 35.8 18.4 34.5L14.8 20Z"
        fill={liquidColor}
        fillOpacity="0.85"
      />

      {/* Artisan Liquid Stratification Accent Line */}
      <path
        d="M15.5 27C18.2 26.2 21.5 28 25 27.5C27.5 27.1 29.2 26.2 30.2 26.8"
        stroke={glassColor}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeOpacity="0.4"
      />

      {/* Subtle Intelligence Spark (4-pointed geometric star) at Upper-Right Rim */}
      <path
        d="M37 6C37 9.5 39.5 12 43 12C39.5 12 37 14.5 37 18C37 14.5 34.5 12 31 12C34.5 12 37 9.5 37 6Z"
        fill={sparkleColor}
      />

      {/* Micro-spark node for subtle geometric connection */}
      <circle cx="29" cy="7" r="1" fill={sparkleColor} fillOpacity="0.75" />
    </svg>
  );
}

export default LogoMark;
