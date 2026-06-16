import type { Likert } from './ratings';

export type AiFeedback = {
  overall_rating?: Likert;
  depth_rating?: Likert;
  grade?: number;
  summary: string;
  depth_feedback?: string;
  surface_level_flags?: string[];
  comparison_summary?: string;
  strengths?: string[];
  improvements?: string[];
  next_drill?: string;
};

export type PracticeSession = {
  id: string;
  prompt: string;
  categoryLabel: string;
  coachingFocus: string;
  structureHint: string;
  notes: string;
  ratings: Record<string, Likert>;
  grade: number;
  durationSeconds: number;
  mimeType: string;
  createdAt: string;
  ai?: AiFeedback;
  referenceSessionId?: string;
};

const DB_NAME = 'speaking-practice-db';
const DB_VERSION = 1;
const SESSION_STORE = 'sessions';
const VIDEO_STORE = 'videos';

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SESSION_STORE)) db.createObjectStore(SESSION_STORE, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(VIDEO_STORE)) db.createObjectStore(VIDEO_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function tx<T>(storeName: string, mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const request = operation(transaction.objectStore(storeName));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function saveSession(session: PracticeSession, video: Blob) {
  await tx(SESSION_STORE, 'readwrite', (store) => store.put(session));
  await tx(VIDEO_STORE, 'readwrite', (store) => store.put(video, session.id));
}

export async function listSessions() {
  const sessions = await tx<PracticeSession[]>(SESSION_STORE, 'readonly', (store) => store.getAll());
  return sessions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getSessionVideo(id: string) {
  return tx<Blob | undefined>(VIDEO_STORE, 'readonly', (store) => store.get(id));
}

export async function updateSessionFeedback(id: string, feedback: AiFeedback) {
  const session = await tx<PracticeSession | undefined>(SESSION_STORE, 'readonly', (store) => store.get(id));
  if (!session) return;
  await tx(SESSION_STORE, 'readwrite', (store) => store.put({ ...session, ai: feedback, grade: feedback.grade ?? session.grade }));
}
