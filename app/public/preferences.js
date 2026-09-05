// Preferences are optional UI state, never the authoritative store for notes.
export function createPreferenceStore(resolveStorage, onFailure = () => {}) {
  const pending = new Map();
  let warned = false;
  const warn = () => { if (!warned) { warned = true; onFailure(); } };
  return {
    getItem(key) {
      if (pending.has(key)) return pending.get(key);
      try { return resolveStorage().getItem(key); }
      catch { warn(); return null; }
    },
    setItem(key, value) {
      const text = String(value);
      // Keep the newest value if persistent storage is full or unavailable.
      pending.set(key, text);
      try { resolveStorage().setItem(key, text); pending.delete(key); }
      catch { warn(); }
    },
  };
}

export function readPreferenceJson(storage, key, fallback, valid) {
  try {
    const value = JSON.parse(storage.getItem(key));
    return valid(value) ? value : fallback;
  } catch { return fallback; }
}

export function readStringList(storage, key, limit) {
  return [...new Set(readPreferenceJson(storage, key, [], Array.isArray)
    .filter((item) => typeof item === "string" && item.length > 0))].slice(0, limit);
}

export function readKanbanViews(storage) {
  return readPreferenceJson(storage, "nimvara-kanban-views", [], Array.isArray)
    .filter((item) => item && typeof item.name === "string" && typeof item.filter === "string")
    .slice(0, 20);
}
