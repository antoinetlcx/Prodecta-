export const STORAGE_KEYS = {
  meetingContext: "prodecta:meeting-context",
  reports: "prodecta:reports",
  followups: "prodecta:followups",
  prospects: "prodecta:prospects",
  meetings: "prodecta:meetings",
  tasks: "prodecta:tasks",
  gmailThreads: "prodecta:gmail-threads"
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function loadLocalValue<T>(key: StorageKey, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  return safeJsonParse(window.localStorage.getItem(key), fallback);
}

export function saveLocalValue<T>(key: StorageKey, value: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function exportProdectaData(): string {
  if (typeof window === "undefined") return "{}";
  const data = Object.values(STORAGE_KEYS).reduce<Record<string, unknown>>((acc, key) => {
    acc[key] = safeJsonParse(window.localStorage.getItem(key), null);
    return acc;
  }, {});
  return JSON.stringify({ exportedAt: new Date().toISOString(), data }, null, 2);
}

export function clearProdectaData(): void {
  if (typeof window === "undefined") return;
  Object.values(STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key));
}
