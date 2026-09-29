export type LogoVariant = "default" | "compact" | "horizontal" | "symbol" | "monochrome";
export type LogoTheme = "dark" | "light" | "cream" | "espresso";

export interface LogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  size?: number | "sm" | "md" | "lg" | "xl";
  className?: string;
  showTagline?: boolean;
}

export type BootTaskStatus = "pending" | "active" | "done" | "error";

export interface BootTasks {
  fonts: BootTaskStatus;
  hero: BootTaskStatus;
  menu: BootTaskStatus;
  barista: BootTaskStatus;
  auth: BootTaskStatus;
}
