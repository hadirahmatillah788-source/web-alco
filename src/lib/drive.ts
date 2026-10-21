/**
 * Utility functions for Google Drive view-only links and embed preview URLs
 */

export function extractGoogleDriveId(url: string): string | null {
  if (!url) return null;

  // Pattern 1: /file/d/{id}
  const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) return fileDMatch[1];

  // Pattern 2: id={id}
  const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) return idParamMatch[1];

  // Pattern 3: /document/d/{id} or /spreadsheets/d/{id} or /presentation/d/{id}
  const docsMatch = url.match(/\/(document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/);
  if (docsMatch && docsMatch[2]) return docsMatch[2];

  return null;
}

export function formatToViewOnlyDriveUrl(url: string): { previewUrl: string; fileId: string | null } {
  if (!url) return { previewUrl: "", fileId: null };

  const trimmed = url.trim();
  const fileId = extractGoogleDriveId(trimmed);

  if (fileId) {
    if (trimmed.includes("docs.google.com/document")) {
      return { previewUrl: `https://docs.google.com/document/d/${fileId}/preview`, fileId };
    }
    if (trimmed.includes("docs.google.com/spreadsheets")) {
      return { previewUrl: `https://docs.google.com/spreadsheets/d/${fileId}/preview`, fileId };
    }
    // Default file preview mode
    return { previewUrl: `https://drive.google.com/file/d/${fileId}/preview`, fileId };
  }

  // Fallback: return as-is
  return { previewUrl: trimmed, fileId: null };
}
