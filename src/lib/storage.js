// localStorage access is wrapped so private-mode / quota errors never break the app.
export function loadJSON(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch (e) {
    return fallback;
  }
}

export function saveJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

export function removeKey(key) {
  try {
    window.localStorage.removeItem(key);
  } catch (e) {
    /* ignore */
  }
}
