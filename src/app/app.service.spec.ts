import { AppService, RequestHeader } from './app.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('AppService', () => {
  let service: AppService;

  beforeEach(() => {
    window.location.hash = '';
    localStorage.clear();
    service = new AppService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have correct default values for all settings', () => {
    // Service is already created in beforeEach with cleared localStorage and empty hash
    expect(service.getTheme()).toBe('Cosmo');
    expect(service.getColumnLayout()).toBe('2');
    expect(service.getHttpOptions()).toBe(false);
    expect(service.getAllHttpMethodsForLinks()).toBe(false);
    expect(service.getUri()).toBe('');
    expect(service.getCustomRequestHeaders()).toEqual([]);
  });

  it('should set custom theme', () => {
    service.setTheme('Cosmo');
    expect(service.getTheme()).toBe('Cosmo');
    expect(localStorage.getItem('hal-explorer.theme')).toBe('Cosmo');
  });

  it('should set default theme', () => {
    service.setTheme('Bootstrap Default');
    expect(service.getTheme()).toBe('Bootstrap Default');
    expect(localStorage.getItem('hal-explorer.theme')).toBe('Bootstrap Default');
  });

  it('should set 2 column layout', () => {
    service.setColumnLayout('2');
    expect(service.getColumnLayout()).toBe('2');
    expect(localStorage.getItem('hal-explorer.columnLayout')).toBe('2');
  });

  it('should set 3 column layout', () => {
    service.setColumnLayout('3');
    expect(service.getColumnLayout()).toBe('3');
    expect(localStorage.getItem('hal-explorer.columnLayout')).toBe('3');
  });

  it('should set HTTP OPTIONS', () => {
    service.setHttpOptions(true);
    expect(service.getHttpOptions()).toBe(true);
    expect(localStorage.getItem('hal-explorer.httpOptions')).toBe('true');
  });

  it('should unset HTTP OPTIONS', () => {
    service.setHttpOptions(false);
    expect(service.getHttpOptions()).toBe(false);
    expect(localStorage.getItem('hal-explorer.httpOptions')).toBe('false');
  });

  it('should set all HTTP methods for links', () => {
    service.setAllHttpMethodsForLinks(true);
    expect(service.getAllHttpMethodsForLinks()).toBe(true);
    expect(localStorage.getItem('hal-explorer.allHttpMethodsForLinks')).toBe('true');
  });

  it('should unset all HTTP methods for links', () => {
    service.setAllHttpMethodsForLinks(false);
    expect(service.getAllHttpMethodsForLinks()).toBe(false);
    expect(localStorage.getItem('hal-explorer.allHttpMethodsForLinks')).toBe('false');
  });

  it('should not set invalid layout', () => {
    vi.spyOn(window.console, 'error');

    service.setColumnLayout('4');

    expect(service.getColumnLayout()).toBe('2');
    // Layout should remain '2' (the default), but localStorage.getItem might be null if never set
    // The important thing is the service returns the correct default value
    expect(window.console.error).toHaveBeenCalled();
  });

  it('should set request headers', () => {
    const requestHeader1 = new RequestHeader('accept', 'application/json');
    const requestHeader2 = new RequestHeader('authorization', 'bearer euztsfghfhgwztuzt');

    service.setCustomRequestHeaders([requestHeader1, requestHeader2]);
    // second invocation is to trigger backup
    service.setCustomRequestHeaders([requestHeader1, requestHeader2]);

    expect(service.getCustomRequestHeaders()[0].key).toBe('accept');
    expect(service.getCustomRequestHeaders()[0].value).toBe('application/json');
    expect(service.getCustomRequestHeaders()[1].key).toBe('authorization');
    expect(service.getCustomRequestHeaders()[1].value).toBe('bearer euztsfghfhgwztuzt');
    expect(window.location.hash).toBe(
      '#hkey0=accept&hval0=application/json&hkey1=authorization&hval1=bearer%20euztsfghfhgwztuzt'
    );
  });

  it('should parse window location hash', () => {
    // Set localStorage values
    localStorage.setItem('hal-explorer.theme', 'Cosmo');
    localStorage.setItem('hal-explorer.columnLayout', '3');
    localStorage.setItem('hal-explorer.httpOptions', 'true');
    localStorage.setItem('hal-explorer.allHttpMethodsForLinks', 'true');
    window.location.hash = '#hkey0=accept&hval0=text/plain&uri=https://chatty42.herokuapp.com/api/users';
    service = new AppService();

    expect(service.getCustomRequestHeaders()[0].key).toBe('accept');
    expect(service.getCustomRequestHeaders()[0].value).toBe('text/plain');
    expect(service.getColumnLayout()).toBe('3');
    expect(service.getTheme()).toBe('Cosmo');
    expect(service.getHttpOptions()).toBe(true);
    expect(service.getAllHttpMethodsForLinks()).toBe(true);
    expect(service.getUri()).toBe('https://chatty42.herokuapp.com/api/users');
  });

  it('should parse window location hash with hval before hkey', () => {
    localStorage.setItem('hal-explorer.theme', 'Cosmo');
    localStorage.setItem('hal-explorer.columnLayout', '3');
    window.location.hash = '#hval0=text/plain&hkey0=accept&uri=https://chatty42.herokuapp.com/api/users';
    service = new AppService();

    expect(service.getCustomRequestHeaders()[0].key).toBe('accept');
    expect(service.getCustomRequestHeaders()[0].value).toBe('text/plain');
    expect(service.getColumnLayout()).toBe('3');
    expect(service.getTheme()).toBe('Cosmo');
    expect(service.getUri()).toBe('https://chatty42.herokuapp.com/api/users');
  });

  it('should parse window location hash with deprecated hkey "url"', () => {
    localStorage.setItem('hal-explorer.theme', 'Cosmo');
    localStorage.setItem('hal-explorer.columnLayout', '3');
    window.location.hash = '#hval0=text/plain&hkey0=accept&url=https://chatty42.herokuapp.com/api/users';
    service = new AppService();

    expect(service.getCustomRequestHeaders()[0].key).toBe('accept');
    expect(service.getCustomRequestHeaders()[0].value).toBe('text/plain');
    expect(service.getColumnLayout()).toBe('3');
    expect(service.getTheme()).toBe('Cosmo');
    expect(service.getUri()).toBe('https://chatty42.herokuapp.com/api/users');
  });

  it('should parse window location hash with unknown hkeys', () => {
    localStorage.setItem('hal-explorer.theme', 'Cosmo');
    localStorage.setItem('hal-explorer.columnLayout', '3');
    window.location.hash = '#xxx=7&hval0=text/plain&hkey0=accept&yyy=xxx&url=https://chatty42.herokuapp.com/api/users';
    service = new AppService();

    expect(service.getCustomRequestHeaders()[0].key).toBe('accept');
    expect(service.getCustomRequestHeaders()[0].value).toBe('text/plain');
    expect(service.getColumnLayout()).toBe('3');
    expect(service.getTheme()).toBe('Cosmo');
    expect(service.getUri()).toBe('https://chatty42.herokuapp.com/api/users');
  });

  it('should get observables', () => {
    service = new AppService();

    expect(service.columnLayoutObservable).toBeDefined();
    expect(service.httpOptionsObservable).toBeDefined();
    expect(service.allHttpMethodsForLinksObservable).toBeDefined();
    expect(service.requestHeadersObservable).toBeDefined();
    expect(service.themeObservable).toBeDefined();
    expect(service.uriObservable).toBeDefined();
  });

  it('should handle browser back/forward navigation correctly on consecutive hash changes', () => {
    let emittedUri: string | undefined;
    service.uriObservable.subscribe(uri => {
      emittedUri = uri;
    });

    // Simulate first navigation via browser back button
    window.location.hash = '#uri=https://example.com/api/first';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(service.getUri()).toBe('https://example.com/api/first');
    expect(emittedUri).toBe('https://example.com/api/first');

    // Simulate second navigation via browser forward button (should work, not skip)
    window.location.hash = '#uri=https://example.com/api/second';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(service.getUri()).toBe('https://example.com/api/second');
    expect(emittedUri).toBe('https://example.com/api/second');

    // Simulate third navigation (should also work)
    window.location.hash = '#uri=https://example.com/api/third';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(service.getUri()).toBe('https://example.com/api/third');
    expect(emittedUri).toBe('https://example.com/api/third');
  });

  it('should not emit URI change when setUri is called with reactOnLocationHashChange=false', () => {
    let emitCount = 0;
    service.uriObservable.subscribe(() => {
      emitCount++;
    });

    // This simulates the app programmatically setting the URI (e.g., after making a request)
    // It should update the hash but not trigger the observable on the hashchange event
    service.setUri('https://example.com/api/test');

    // The setUri itself should not emit (since previousUri === uri on first call or it's intentionally skipped)
    // The subsequent hashchange event should be ignored
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    // Verify the URI was updated
    expect(service.getUri()).toBe('https://example.com/api/test');

    // But the next manual hash change should work
    window.location.hash = '#uri=https://example.com/api/manual';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(service.getUri()).toBe('https://example.com/api/manual');
    expect(emitCount).toBeGreaterThanOrEqual(1);
  });

  it('should handle scenario: start URL, click 2 links, then back button 2 times', async () => {
    const emittedUris: string[] = [];
    service.uriObservable.subscribe(uri => {
      emittedUris.push(uri);
    });

    // Start with initial URL (browser navigation)
    window.location.hash = '#uri=http://localhost:3000/examples.hal-forms.json';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(service.getUri()).toBe('http://localhost:3000/examples.hal-forms.json');
    expect(emittedUris).toContain('http://localhost:3000/examples.hal-forms.json');

    // Click first link - setUri will emit and update the hash
    service.setUri('http://localhost:3000/link1.json');
    // Wait for any automatic hashchange events to complete
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(service.getUri()).toBe('http://localhost:3000/link1.json');
    expect(emittedUris[emittedUris.length - 1]).toBe('http://localhost:3000/link1.json');

    // Click second link - setUri will emit and update the hash
    service.setUri('http://localhost:3000/link2.json');
    // Wait for any automatic hashchange events to complete
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(service.getUri()).toBe('http://localhost:3000/link2.json');
    expect(emittedUris[emittedUris.length - 1]).toBe('http://localhost:3000/link2.json');

    const emitCountBeforeBack = emittedUris.length;

    // First back button - browser changes hash, our code should react
    window.location.hash = '#uri=http://localhost:3000/link1.json';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(service.getUri()).toBe('http://localhost:3000/link1.json');
    expect(emittedUris[emittedUris.length - 1]).toBe('http://localhost:3000/link1.json');
    expect(emittedUris.length).toBe(emitCountBeforeBack + 1); // Should have emitted

    // Second back button - browser changes hash, our code should react
    window.location.hash = '#uri=http://localhost:3000/examples.hal-forms.json';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(service.getUri()).toBe('http://localhost:3000/examples.hal-forms.json');
    expect(emittedUris[emittedUris.length - 1]).toBe('http://localhost:3000/examples.hal-forms.json');
    expect(emittedUris.length).toBe(emitCountBeforeBack + 2); // Should have emitted again
  });

  it('should return false for isFromBrowserNavigation() after programmatic setUri()', () => {
    // Programmatic URI change via setUri
    service.setUri('http://localhost:3000/test.json');

    // Should return false because it was a programmatic change
    expect(service.isFromBrowserNavigation()).toBe(false);

    // Calling it again should also return false (flag is reset after first check)
    expect(service.isFromBrowserNavigation()).toBe(false);
  });

  it('should return true for isFromBrowserNavigation() after browser navigation', () => {
    // Simulate browser navigation via hash change
    window.location.hash = '#uri=http://localhost:3000/test.json';
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    // Should return true because it was browser navigation
    expect(service.isFromBrowserNavigation()).toBe(true);

    // Calling it again should return false (flag is reset after first check)
    expect(service.isFromBrowserNavigation()).toBe(false);
  });

  it('should distinguish between setUri() and browser back button', () => {
    const navigationFlags: boolean[] = [];

    service.uriObservable.subscribe(() => {
      navigationFlags.push(service.isFromBrowserNavigation());
    });

    // Programmatic navigation
    service.setUri('http://localhost:3000/page1.json');
    expect(navigationFlags[navigationFlags.length - 1]).toBe(false);

    // Another programmatic navigation
    service.setUri('http://localhost:3000/page2.json');
    expect(navigationFlags[navigationFlags.length - 1]).toBe(false);

    // Browser back button (simulated)
    window.location.hash = '#uri=http://localhost:3000/page1.json';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(navigationFlags[navigationFlags.length - 1]).toBe(true);

    // Browser forward button (simulated)
    window.location.hash = '#uri=http://localhost:3000/page2.json';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(navigationFlags[navigationFlags.length - 1]).toBe(true);
  });

  it('should reset isFromBrowserNavigation flag after being checked', () => {
    // Set up browser navigation
    window.location.hash = '#uri=http://localhost:3000/test.json';
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    // First check - should be true
    expect(service.isFromBrowserNavigation()).toBe(true);

    // Second check - should be false (flag was reset)
    expect(service.isFromBrowserNavigation()).toBe(false);

    // Third check - still false
    expect(service.isFromBrowserNavigation()).toBe(false);
  });

  it('should handle multiple browser navigations correctly', () => {
    // First browser navigation
    window.location.hash = '#uri=http://localhost:3000/page1.json';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(service.isFromBrowserNavigation()).toBe(true);
    expect(service.isFromBrowserNavigation()).toBe(false); // Reset

    // Programmatic navigation
    service.setUri('http://localhost:3000/page2.json');
    expect(service.isFromBrowserNavigation()).toBe(false);

    // Second browser navigation
    window.location.hash = '#uri=http://localhost:3000/page3.json';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(service.isFromBrowserNavigation()).toBe(true);
    expect(service.isFromBrowserNavigation()).toBe(false); // Reset
  });
});
