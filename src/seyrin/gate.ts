// Who may open the Seyrin dev tools (DES-009 §2.2/§5): only a development server, reached on this machine.
const loopback = (hostname: string) => hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname.endsWith('.localhost');
/** the P1 pose viewer: ?seyrin=preview */
export function previewAllowed(dev: boolean, hostname: string, query: URLSearchParams): boolean {
  return dev && loopback(hostname) && query.get('seyrin') === 'preview';
}
/** an IPv4 address of a private network: 10/8, 172.16/12, 192.168/16, link-local 169.254/16 (also as ::ffff:a.b.c.d). Names never count. */
export function privateAddress(address: string): boolean {
  const m = /^(?:::ffff:)?(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/i.exec(address);
  if (!m) return false;
  const [a, b, c, d] = m.slice(1).map(Number);
  if (a > 255 || b > 255 || c > 255 || d > 255) return false;
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254);
}
/** the address of a request to the dev server: this machine, or with the home-LAN flag a private address; never a public one */
export function inboxAllowed(remoteAddress: string | undefined, lan: boolean): boolean {
  if (!remoteAddress) return false;
  return remoteAddress === '::1' || remoteAddress === '127.0.0.1' || remoteAddress === '::ffff:127.0.0.1' || (lan && privateAddress(remoteAddress));
}
/** playtesting the `ninja-roam-1` rules: ?ruleset=ninja-roam-1 on the dev server (never in a published build), on this machine;
 *  `lan` (the dev server was started with SYNES_SEYRIN_LAN=1: the owner's phone on the home Wi-Fi) also takes a private address */
export function ninjaQaAllowed(dev: boolean, hostname: string, query: URLSearchParams, lan = false): boolean {
  return dev && (loopback(hostname) || (lan && privateAddress(hostname))) && query.get('ruleset') === 'ninja-roam-1';
}
