// Talks to the authoritative server when one is reachable on the same origin. Static hosting ⇒ offline mode.
export type NetMode = 'online' | 'offline';
export interface RunTicket { runId: string; seed: number; }

export class Net {
  mode: NetMode = 'offline';
  async detect(): Promise<NetMode> {
    if (new URLSearchParams(location.search).has('offline')) return (this.mode = 'offline');
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 1500);
      const r = await fetch('./api/health', { signal: ctl.signal, cache: 'no-store' }); clearTimeout(t);
      const j = r.ok ? await r.json() : null;
      this.mode = j?.game === 'synes-online' ? 'online' : 'offline';
    } catch { this.mode = 'offline'; }
    return this.mode;
  }
  async start(): Promise<RunTicket | null> {
    if (this.mode !== 'online') return null;
    try { const r = await fetch('./api/run/start', { method: 'POST' }); return r.ok ? await r.json() : null; } catch { return null; }
  }
  /** Retries while the device is offline (e.g. lost signal on the bus); resolves with the server verdict. */
  async finish(runId: string, log: number[], tries = 6): Promise<any> {
    for (let i = 0; i < tries; i++) {
      try {
        if (!navigator.onLine) throw new Error('offline');
        const r = await fetch('./api/run/finish', { method: 'POST', body: JSON.stringify({ runId, log }), headers: { 'content-type': 'application/json' } });
        const j = await r.json();
        if (r.ok) return j;
        return { error: j.error || r.status };
      } catch { await new Promise((res) => setTimeout(res, 1500 * (i + 1))); }
    }
    return { error: 'network' };
  }
}
