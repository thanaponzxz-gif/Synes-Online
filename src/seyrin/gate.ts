// Who may open the Seyrin pose viewer (DES-009 §2.2/§5): only a development server, reached on this machine.
export function previewAllowed(dev: boolean, hostname: string, query: URLSearchParams): boolean {
  const loopback = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname.endsWith('.localhost');
  return dev && loopback && query.get('seyrin') === 'preview';
}
