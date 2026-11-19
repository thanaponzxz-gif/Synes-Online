// Device profiles for emulated testing. NOTE: Chromium emulation only — NOT real devices.
// GPU is SwiftShader (software) in CI; CPU throttle applies to the renderer main thread only.
export const PROFILES = {
  'android-low':  { viewport: { width: 760, height: 360 }, dpr: 2,   mobile: true,  cpu: 6, net: { latency: 150, down: 1.6e6 / 8, up: 750e3 / 8 } },   // Lighthouse "Slow 4G"
  'android-mid':  { viewport: { width: 915, height: 412 }, dpr: 2.6, mobile: true,  cpu: 4, net: { latency: 60,  down: 9e6 / 8,   up: 1.5e6 / 8 } },  // DevTools "Fast 4G"
  'iphone-class': { viewport: { width: 844, height: 390 }, dpr: 3,   mobile: true,  cpu: 2, net: { latency: 60,  down: 9e6 / 8,   up: 1.5e6 / 8 } },  // Chromium w/ iPhone metrics, NOT Safari/WebKit
  'pc':           { viewport: { width: 1280, height: 720 }, dpr: 1,  mobile: false, cpu: 1, net: null },
};
export async function applyProfile(context, page, prof) {
  const cdp = await context.newCDPSession(page);
  if (prof.cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: prof.cpu });
  if (prof.net) { await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: prof.net.latency, downloadThroughput: prof.net.down, uploadThroughput: prof.net.up }); }
  return cdp;
}
export function contextOpts(prof) {
  return { viewport: prof.viewport, deviceScaleFactor: prof.dpr, isMobile: prof.mobile, hasTouch: prof.mobile, userAgent: prof.mobile ? 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Mobile Safari/537.36' : undefined };
}
export const LAUNCH_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-precise-memory-info', '--ignore-gpu-blocklist'];
