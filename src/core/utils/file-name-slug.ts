/** Normalize a filename component without backtracking on long runs of hyphens. */
export function fileNameSlug(value: string, fallback: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-");
  let start = 0;
  let end = normalized.length;
  while (start < end && normalized[start] === "-") start++;
  while (end > start && normalized[end - 1] === "-") end--;
  return normalized.slice(start, end) || fallback;
}
