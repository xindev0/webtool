/**
 * Escapes HTML special characters to prevent XSS
 */
export function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

/**
 * Escapes attribute values to prevent HTML injection
 */
export function escapeAttr(input: string): string {
  return input.replaceAll('"', '&quot;')
}

/**
 * Validates if a string is a valid HTTP/HTTPS URL
 */
export function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str)
    return ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
}
