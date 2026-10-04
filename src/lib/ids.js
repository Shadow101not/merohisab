export function uid(prefix = 'id') {
  const rand =
    Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
  return `${prefix}_${rand}`;
}
