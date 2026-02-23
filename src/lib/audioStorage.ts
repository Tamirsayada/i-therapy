import { createClient } from "@/lib/supabase/client";

const DB_NAME = "itherapy-audio";
const STORE_NAME = "meditation-audio";
const DB_VERSION = 1;
const BUCKET = "meditation-audio";

// ---- IndexedDB (local cache) ----

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function cacheGet(key: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

async function cachePut(key: string, blob: Blob): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(blob, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Cache failure is non-critical
  }
}

async function cacheDelete(key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Cache failure is non-critical
  }
}

// ---- Supabase Storage ----

async function getUserId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function storagePath(userId: string, key: string): string {
  return `${userId}/${key}.wav`;
}

export async function saveAudio(key: string, blob: Blob): Promise<void> {
  // Save to local cache first (fast)
  await cachePut(key, blob);

  // Upload to Supabase Storage
  const userId = await getUserId();
  if (!userId) return;

  const supabase = createClient();
  const path = storagePath(userId, key);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { upsert: true });

  if (error) {
    console.error("Failed to upload audio to Supabase:", error);
  }
}

export async function getAudio(key: string): Promise<Blob | null> {
  // Try local cache first
  const cached = await cacheGet(key);
  if (cached) return cached;

  // Fall back to Supabase Storage
  const userId = await getUserId();
  if (!userId) return null;

  const supabase = createClient();
  const path = storagePath(userId, key);
  const { data, error } = await supabase.storage.from(BUCKET).download(path);

  if (error || !data) return null;

  // Cache locally for next time
  await cachePut(key, data);
  return data;
}

export async function deleteAudio(key: string): Promise<void> {
  // Delete from local cache
  await cacheDelete(key);

  // Delete from Supabase Storage
  const userId = await getUserId();
  if (!userId) return;

  const supabase = createClient();
  const path = storagePath(userId, key);
  const { error } = await supabase.storage.from(BUCKET).remove([path]);

  if (error) {
    console.error("Failed to delete audio from Supabase:", error);
  }
}
