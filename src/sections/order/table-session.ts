const TABLE_NAMES_COOKIE = 'hh-table-names';
const ACTIVE_TABLE_COOKIE = 'hh-active-table';

// Browsers cap cookie Max-Age at ~400 days — this keeps the "already
// entered my name for this table" and "device has a table open" state
// alive indefinitely for all practical purposes, same as the old
// localStorage values that never expired on their own.
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  const entry = document.cookie.split('; ').find((part) => part.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
}

function writeCookie(name: string, value: string): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}

function readTableNames(): Record<string, string> {
  const raw = readCookie(TABLE_NAMES_COOKIE);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function getSavedTableName(table: string): string | null {
  return readTableNames()[table] ?? null;
}

export function saveTableName(table: string, name: string): void {
  const names = readTableNames();
  names[table] = name;
  writeCookie(TABLE_NAMES_COOKIE, JSON.stringify(names));
}

export function clearTableName(table: string): void {
  const names = readTableNames();
  delete names[table];
  writeCookie(TABLE_NAMES_COOKIE, JSON.stringify(names));
}

/**
 * The one table this device currently has "open" — set once a customer gets
 * past the name gate for a scanned table, cleared once that table's session
 * is confirmed closed. Used to stop a single device from opening more than
 * one table at a time (each new scan must go through the active one first).
 */
export function getActiveTable(): string | null {
  return readCookie(ACTIVE_TABLE_COOKIE);
}

export function setActiveTable(table: string): void {
  writeCookie(ACTIVE_TABLE_COOKIE, table);
}

export function clearActiveTable(): void {
  deleteCookie(ACTIVE_TABLE_COOKIE);
}
