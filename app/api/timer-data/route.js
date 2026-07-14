import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

/* Banco do timer.
   - Produção (Vercel): Upstash Redis via REST (crie no marketplace da Vercel;
     as env vars KV_REST_API_URL/KV_REST_API_TOKEN são adicionadas sozinhas).
   - Dev local: JSON em data/timer-db.json.
   Chaves: cfg, modes, playlists, sounds_start, sounds_end (sons separados
   para caber no limite de 1 MB por request do plano free da Upstash). */

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const useKv = Boolean(KV_URL && KV_TOKEN);

const KEYS = ['cfg', 'modes', 'playlists', 'sounds_start', 'sounds_end'];
const FILE = path.join(process.cwd(), 'data', 'timer-db.json');

/* ---------- Upstash (produção) ---------- */
const kvHeaders = { Authorization: `Bearer ${KV_TOKEN}` };

async function kvGet(key) {
  try {
    const r = await fetch(`${KV_URL}/get/timer:${key}`, { headers: kvHeaders, cache: 'no-store' });
    const j = await r.json();
    return j?.result != null ? JSON.parse(j.result) : undefined;
  } catch {
    return undefined;
  }
}

async function kvSet(key, value) {
  await fetch(`${KV_URL}/set/timer:${key}`, {
    method: 'POST',
    headers: kvHeaders,
    body: JSON.stringify(value),
  });
}

/* ---------- Arquivo local (dev) ---------- */
async function fileRead() {
  try {
    return JSON.parse(await fs.readFile(FILE, 'utf8'));
  } catch {
    return {};
  }
}

async function fileWrite(db) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(db));
}

/* Converte { sounds: {start,end} } ⇄ chaves separadas */
const splitBody = (body) => {
  const out = {};
  if (body.cfg) out.cfg = body.cfg;
  if (body.modes) out.modes = body.modes;
  if (body.playlists) out.playlists = body.playlists;
  if (body.sounds) {
    out.sounds_start = body.sounds.start ?? null;
    out.sounds_end = body.sounds.end ?? null;
  }
  return out;
};

const joinDb = (flat) => ({
  cfg: flat.cfg,
  modes: flat.modes,
  playlists: flat.playlists,
  sounds: { start: flat.sounds_start ?? null, end: flat.sounds_end ?? null },
});

export async function GET() {
  if (useKv) {
    const entries = await Promise.all(KEYS.map(async (k) => [k, await kvGet(k)]));
    return Response.json(joinDb(Object.fromEntries(entries)));
  }
  return Response.json(joinDb(await fileRead()));
}

export async function POST(req) {
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') throw new Error('bad body');
    const flat = splitBody(body);

    if (useKv) {
      await Promise.all(Object.entries(flat).map(([k, v]) => kvSet(k, v)));
    } else {
      const db = await fileRead();
      await fileWrite({ ...db, ...flat });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
