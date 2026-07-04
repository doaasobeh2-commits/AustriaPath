import { beforeEach, vi } from "vitest";

const store = new Map();

beforeEach(() => {
  store.clear();
  vi.stubGlobal("localStorage", {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  });
});

export function setStorage(key, value) {
  store.set(key, typeof value === "string" ? value : JSON.stringify(value));
}
