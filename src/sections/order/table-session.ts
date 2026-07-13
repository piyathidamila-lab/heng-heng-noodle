const STORAGE_PREFIX = 'hh-table-name-';

function storageKey(table: string): string {
  return `${STORAGE_PREFIX}${table}`;
}

export function getSavedTableName(table: string): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(storageKey(table));
}

export function saveTableName(table: string, name: string): void {
  window.localStorage.setItem(storageKey(table), name);
}

export function clearTableName(table: string): void {
  window.localStorage.removeItem(storageKey(table));
}
