/**
 * Client-Side Input Sanitization & Security Helpers
 */

/**
 * Strips script tags, iframe, style, and dangerous attributes from user strings
 */
export function sanitizeClientInput(input: string): string {
  if (!input) return "";
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "")
    .replace(/javascript:[^\s"']*/gi, "")
    .trim();
}

/**
 * Validates whether a redirect path is internal and safe
 */
export function isSafeRedirectUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  // Must start with single slash, not double slash (open redirect prevention)
  return url.startsWith("/") && !url.startsWith("//");
}
