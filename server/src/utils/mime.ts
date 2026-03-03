type ClaudeImageMime = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

/** Normalize non-standard image MIME types to ones Claude Vision accepts. */
export function normalizeImageMime(mimeType?: string): ClaudeImageMime {
  if (!mimeType) return 'image/jpeg';
  if (['image/jpg', 'image/heic', 'image/heif'].includes(mimeType)) {
    return 'image/jpeg';
  }
  return mimeType as ClaudeImageMime;
}
