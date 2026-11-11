import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type {
  LibraryFileItem,
  LibraryFileType,
} from '@/data/orasorasData';

const DB_NAME = 'orasoras_library_v1';
const DB_VERSION = 3;
const STORE_FILES = 'files_metadata';
const STORE_BLOBS = 'files_blobs';
const STORE_FOLDERS = 'folders_metadata';
const STORE_CUSTOM_SUBJECTS = 'custom_subjects';

/** In-memory blob URL cache for ultra-fast instant preview and reliable playback */
const memoryBlobMap = new Map<string, string>();

export interface StorageUsageStats {
  totalBytes: number;
  totalFormatted: string;
  fileCount: number;
  offlineBytes: number;
  offlineFormatted: string;
  bySubject: {
    subjectId: string;
    subjectName: string;
    color: string;
    bytes: number;
    formatted: string;
    fileCount: number;
  }[];
  byType: {
    type: LibraryFileType;
    bytes: number;
    formatted: string;
    count: number;
    color: string;
  }[];
  largestFiles: LibraryFileItem[];
}

/** Open or initialize the browser IndexedDB */
function openIndexedDb(): Promise<IDBDatabase | null> {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => {
        console.warn('IndexedDB open error:', request.error);
        resolve(null);
      };
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_FILES)) {
          db.createObjectStore(STORE_FILES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_BLOBS)) {
          db.createObjectStore(STORE_BLOBS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_FOLDERS)) {
          db.createObjectStore(STORE_FOLDERS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_CUSTOM_SUBJECTS)) {
          db.createObjectStore(STORE_CUSTOM_SUBJECTS, { keyPath: 'id' });
        }
      };
    } catch (e) {
      console.warn('IndexedDB not supported or blocked:', e);
      resolve(null);
    }
  });
}

// Formats byte count to readable string

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function detectFileType(fileName: string, mimeType?: string): LibraryFileType {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf' || mimeType?.includes('pdf')) return 'pdf';
  if (['doc', 'docx', 'odt', 'rtf'].includes(ext) || mimeType?.includes('word')) return 'doc';
  if (['ppt', 'pptx', 'odp', 'key'].includes(ext) || mimeType?.includes('presentation')) return 'ppt';
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext) || mimeType?.includes('sheet') || mimeType?.includes('csv')) return 'sheet';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext) || mimeType?.startsWith('image/')) return 'image';
  if (['txt', 'md', 'json', 'ts', 'js', 'html', 'py', 'java', 'c', 'cpp'].includes(ext) || mimeType?.startsWith('text/')) return 'text';
  return 'other';
}

export function getFileTypeColor(type: LibraryFileType): string {
  switch (type) {
    case 'pdf': return '#EF4444';     // Red accent
    case 'doc': return '#3B82F6';     // Blue accent
    case 'ppt': return '#F97316';     // Orange accent
    case 'sheet': return '#10B981';   // Green accent
    case 'image': return '#8B5CF6';   // Violet accent
    case 'text': return '#06B6D4';    // Cyan accent
    default: return '#64748B';        // Slate accent
  }
}

export function getFileTypeIcon(type: LibraryFileType): string {
  switch (type) {
    case 'pdf': return 'document-text';
    case 'doc': return 'reader';
    case 'ppt': return 'easel';
    case 'sheet': return 'grid';
    case 'image': return 'image';
    case 'text': return 'code-slash';
    default: return 'attach';
  }
}

// ── Native FileSystem Helpers ───────────────────────────────────────────────
const nativeLibraryDir = () => `${FileSystem.documentDirectory}library/`;

async function ensureNativeDir(subPath = ''): Promise<string> {
  const dir = `${nativeLibraryDir()}${subPath}`;
  if (Platform.OS !== 'web') {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
  }
  return dir;
}

// ── Save File (IndexedDB on Web, FileSystem on Native) ───────────────────────
export async function saveLibraryFileBlob(
  fileItem: LibraryFileItem,
  blobOrFile?: Blob | File | string
): Promise<string | undefined> {
  if (!blobOrFile) return undefined;

  if (Platform.OS === 'web') {
    let resolvedBlob: Blob | null = null;
    if (blobOrFile instanceof Blob) {
      resolvedBlob = blobOrFile;
    } else if (typeof blobOrFile === 'string') {
      if (
        blobOrFile.startsWith('blob:') ||
        blobOrFile.startsWith('data:') ||
        blobOrFile.startsWith('http')
      ) {
        try {
          const res = await fetch(blobOrFile);
          resolvedBlob = await res.blob();
        } catch (e) {
          console.warn('Could not fetch blob from string URI:', e);
        }
      }
    }

    if (resolvedBlob) {
      try {
        const memUrl = URL.createObjectURL(resolvedBlob);
        memoryBlobMap.set(fileItem.id, memUrl);
      } catch {
        // ignore in environments without URL.createObjectURL
      }

      const db = await openIndexedDb();
      if (db) {
        return new Promise((resolve) => {
          try {
            const tx = db.transaction(STORE_BLOBS, 'readwrite');
            const store = tx.objectStore(STORE_BLOBS);
            store.put({
              id: fileItem.id,
              blob: resolvedBlob,
              fileName: fileItem.originalFileName,
              mimeType: fileItem.mimeType,
              updatedAt: Date.now(),
            });
            tx.oncomplete = () => {
              db.close();
              resolve(`indexeddb://${fileItem.id}`);
            };
            tx.onerror = () => {
              db.close();
              resolve(typeof blobOrFile === 'string' ? blobOrFile : undefined);
            };
          } catch {
            db.close();
            resolve(typeof blobOrFile === 'string' ? blobOrFile : undefined);
          }
        });
      }
    }
    return typeof blobOrFile === 'string' ? blobOrFile : undefined;
  }

  // Native: copy to library directory (supports file://, content://, /, ph://)
  if (
    typeof blobOrFile === 'string' &&
    (blobOrFile.startsWith('file://') ||
      blobOrFile.startsWith('content://') ||
      blobOrFile.startsWith('/') ||
      blobOrFile.startsWith('ph://'))
  ) {
    try {
      const ext = fileItem.fileExtension ? `.${fileItem.fileExtension}` : '';
      const targetDir = await ensureNativeDir(`${fileItem.accountId}/`);
      const targetUri = `${targetDir}${fileItem.id}${ext}`;
      await FileSystem.copyAsync({ from: blobOrFile, to: targetUri });
      return targetUri;
    } catch (e) {
      console.warn('Native copyAsync failed, using original source URI:', e);
      return blobOrFile;
    }
  }

  return undefined;
}

// ── Delete File Blob (IndexedDB on Web, FileSystem on Native) ───────────────
export async function deleteLibraryFileBlob(fileItem: LibraryFileItem): Promise<void> {
  memoryBlobMap.delete(fileItem.id);

  if (Platform.OS === 'web') {
    const db = await openIndexedDb();
    if (db) {
      try {
        const tx = db.transaction(STORE_BLOBS, 'readwrite');
        const store = tx.objectStore(STORE_BLOBS);
        store.delete(fileItem.id);
        tx.oncomplete = () => db.close();
        tx.onerror = () => db.close();
      } catch {
        db.close();
      }
    }
    return;
  }

  if (fileItem.localUri) {
    try {
      await FileSystem.deleteAsync(fileItem.localUri, { idempotent: true });
    } catch {
      // ignore deletion errors
    }
  }
}

// ── Retrieve File Blob URL for In-App Reader / Download ──────────────────────
export async function getFileBlobUrl(fileItem: LibraryFileItem): Promise<string | null> {
  if (fileItem.dataUrl) return fileItem.dataUrl;

  if (Platform.OS === 'web') {
    if (memoryBlobMap.has(fileItem.id)) {
      return memoryBlobMap.get(fileItem.id)!;
    }

    const db = await openIndexedDb();
    if (db) {
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_BLOBS, 'readonly');
          const store = tx.objectStore(STORE_BLOBS);
          const req = store.get(fileItem.id);
          req.onsuccess = () => {
            const result = req.result;
            db.close();
            if (result?.blob) {
              const url = URL.createObjectURL(result.blob);
              memoryBlobMap.set(fileItem.id, url);
              resolve(url);
            } else {
              const safeFallback =
                fileItem.localUri && !fileItem.localUri.startsWith('indexeddb://')
                  ? fileItem.localUri
                  : null;
              resolve(safeFallback);
            }
          };
          req.onerror = () => {
            db.close();
            const safeFallback =
              fileItem.localUri && !fileItem.localUri.startsWith('indexeddb://')
                ? fileItem.localUri
                : null;
            resolve(safeFallback);
          };
        } catch {
          db.close();
          const safeFallback =
            fileItem.localUri && !fileItem.localUri.startsWith('indexeddb://')
              ? fileItem.localUri
              : null;
          resolve(safeFallback);
        }
      });
    }
  }

  if (fileItem.localUri && !fileItem.localUri.startsWith('indexeddb://')) {
    return fileItem.localUri;
  }

  return null;
}

// ── Share or Download File ──────────────────────────────────────────────────
export async function shareOrDownloadFile(fileItem: LibraryFileItem): Promise<void> {
  const blobUrl = await getFileBlobUrl(fileItem);

  if (Platform.OS === 'web') {
    // If Web Share API is available and supported for files
    if (navigator.share && blobUrl) {
      try {
        await navigator.share({
          title: fileItem.title,
          text: `OrasOras Academic Library: ${fileItem.title} (${fileItem.subjectName})`,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to direct file download
      }
    }

    // Trigger standard browser download
    if (blobUrl) {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileItem.originalFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
  }

  // Native: expo-sharing
  if (fileItem.localUri && (await Sharing.isAvailableAsync())) {
    await Sharing.shareAsync(fileItem.localUri, {
      dialogTitle: `Share ${fileItem.title}`,
      mimeType: fileItem.mimeType,
    });
  }
}

// ── Calculate Storage Stats ─────────────────────────────────────────────────
export function computeStorageStats(
  files: LibraryFileItem[],
  subjects: { id: string; name: string; color: string }[]
): StorageUsageStats {
  let totalBytes = 0;
  let offlineBytes = 0;

  const subjectMap = new Map<string, { bytes: number; count: number }>();
  const typeMap = new Map<LibraryFileType, { bytes: number; count: number }>();

  for (const f of files) {
    const size = f.fileSize || 0;
    totalBytes += size;
    if (f.isOfflineAvailable) {
      offlineBytes += size;
    }

    // By subject
    const prevSub = subjectMap.get(f.subjectId) || { bytes: 0, count: 0 };
    subjectMap.set(f.subjectId, {
      bytes: prevSub.bytes + size,
      count: prevSub.count + 1,
    });

    // By type
    const prevType = typeMap.get(f.fileType) || { bytes: 0, count: 0 };
    typeMap.set(f.fileType, {
      bytes: prevType.bytes + size,
      count: prevType.count + 1,
    });
  }

  const bySubject = subjects.map((s) => {
    const stats = subjectMap.get(s.id) || { bytes: 0, count: 0 };
    return {
      subjectId: s.id,
      subjectName: s.name,
      color: s.color,
      bytes: stats.bytes,
      formatted: formatBytes(stats.bytes),
      fileCount: stats.count,
    };
  }).filter((s) => s.fileCount > 0);

  const typeKeys: LibraryFileType[] = ['pdf', 'doc', 'ppt', 'sheet', 'image', 'text', 'other'];
  const byType = typeKeys.map((t) => {
    const stats = typeMap.get(t) || { bytes: 0, count: 0 };
    return {
      type: t,
      bytes: stats.bytes,
      formatted: formatBytes(stats.bytes),
      count: stats.count,
      color: getFileTypeColor(t),
    };
  }).filter((t) => t.count > 0);

  const largestFiles = [...files]
    .sort((a, b) => (b.fileSize || 0) - (a.fileSize || 0))
    .slice(0, 5);

  return {
    totalBytes,
    totalFormatted: formatBytes(totalBytes),
    fileCount: files.length,
    offlineBytes,
    offlineFormatted: formatBytes(offlineBytes),
    bySubject,
    byType,
    largestFiles,
  };
}
