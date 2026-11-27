// Who may open the Seyrin dev tools (DES-009 §2.2/§5): only a development server, reached on this machine.
const loopback = (hostname: string) => hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname.endsWith('.localhost');
/** the P1 pose viewer: ?seyrin=preview */
export function previewAllowed(dev: boolean, hostname: string, query: URLSearchParams): boolean {
  return dev && loopback(hostname) && query.get('seyrin') === 'preview';
}
/** playtesting the `ninja-roam-1` rules with the Wayfarer placeholder: ?ruleset=ninja-roam-1 (never in a published build) */
export function ninjaQaAllowed(dev: boolean, hostname: string, query: URLSearchParams): boolean {
  return dev && loopback(hostname) && query.get('ruleset') === 'ninja-roam-1';
}
