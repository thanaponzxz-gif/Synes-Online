// Resolve the pre-installed Playwright (global) from ESM scripts.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
export const { chromium, devices } = require('playwright');
