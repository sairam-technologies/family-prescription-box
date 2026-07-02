/** Whether a file is a PDF by mime type or filename. */
export function isPdfFile(mimeType?: string | null, fileNameOrUrl?: string | null): boolean {
  if (mimeType === "application/pdf") return true;
  if (!fileNameOrUrl) return false;
  return /\.pdf($|\?)/i.test(fileNameOrUrl);
}

/** Whether the URL is served through our authenticated files proxy. */
export function isProxiedFileUrl(url: string): boolean {
  return url.startsWith("/api/files") || url.includes("/api/files/");
}

export function resolveUploadContentType(
  file: File | { type: string; name: string }
): string {
  if (file.type) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".gif")) return "image/gif";
  if (/\.(jpe?g)$/.test(name)) return "image/jpeg";
  if (name.endsWith(".heic")) return "image/heic";
  if (name.endsWith(".heif")) return "image/heif";
  return "application/octet-stream";
}
