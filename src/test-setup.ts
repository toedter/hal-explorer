import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - BrowserDynamicTestingModule is deprecated but required for proper TestBed initialization
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

// Initialize the Angular testing environment
// Even with @analogjs/vite-plugin-angular, explicit TestBed initialization is still required
getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting(), {
  teardown: { destroyAfterEach: true },
});

// Mock global objects that might not be available in jsdom
globalThis.CSS = {
  supports: () => false,
  escape: (value: string) => value,
} as any;

// Mock matchMedia for JSDOM
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    addListener: () => {}, // deprecated but required for MediaQueryList interface
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    removeListener: () => {}, // deprecated but required for MediaQueryList interface
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    addEventListener: () => {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});
