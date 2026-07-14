/* Cliente do "banco" mockado (/api/timer-data).
   Salva com debounce para não fazer request a cada tecla. */

const timers = {};

export async function dbLoad() {
  try {
    const r = await fetch('/api/timer-data', { cache: 'no-store' });
    if (r.ok) return await r.json();
  } catch {}
  return null;
}

export function dbSave(partial, key = 'default') {
  clearTimeout(timers[key]);
  timers[key] = setTimeout(async () => {
    try {
      await fetch('/api/timer-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      });
    } catch {}
  }, 800);
}
