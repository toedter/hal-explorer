import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

const STORAGE_PREFIX = 'hal-explorer.';
const DEFAULT_THEME = 'Cosmo';
const DEFAULT_LAYOUT = '2';

export class RequestHeader {
  constructor(
    public key: string,
    public value: string
  ) {}
}

@Injectable({
  providedIn: 'root',
})
export class AppService {
  private uriParam = '';
  private themeParam = DEFAULT_THEME;
  private columnLayoutParam = DEFAULT_LAYOUT;
  private httpOptionsParam = false;
  private allHttpMethodsForLinksParam = false;
  private customRequestHeaders: RequestHeader[] = [];
  private previousUriParam = '';
  private fromBrowserNavigation = false;

  private readonly uriSubject = new Subject<string>();
  private readonly themeSubject = new Subject<string>();
  private readonly layoutSubject = new Subject<string>();
  private readonly httpOptionsSubject = new Subject<boolean>();
  private readonly allHttpMethodsForLinksSubject = new Subject<boolean>();
  private readonly requestHeadersSubject = new Subject<RequestHeader[]>();

  readonly uriObservable = this.uriSubject.asObservable();
  readonly themeObservable = this.themeSubject.asObservable();
  readonly columnLayoutObservable = this.layoutSubject.asObservable();
  readonly httpOptionsObservable = this.httpOptionsSubject.asObservable();
  readonly allHttpMethodsForLinksObservable = this.allHttpMethodsForLinksSubject.asObservable();
  readonly requestHeadersObservable = this.requestHeadersSubject.asObservable();

  constructor() {
    this.initializeFromLocalStorage();
    this.handleLocationHash();
    globalThis.addEventListener('hashchange', () => this.handleLocationHash(), false);
  }

  private initializeFromLocalStorage(): void {
    this.themeParam = this.getFromStorage('theme', DEFAULT_THEME);
    this.columnLayoutParam = this.getFromStorage('columnLayout', DEFAULT_LAYOUT);
    this.httpOptionsParam = this.getBooleanFromStorage('httpOptions', false);
    this.allHttpMethodsForLinksParam = this.getBooleanFromStorage('allHttpMethodsForLinks', false);
  }

  private getFromStorage(key: string, defaultValue: string): string {
    return localStorage.getItem(STORAGE_PREFIX + key) || defaultValue;
  }

  private getBooleanFromStorage(key: string, defaultValue: boolean): boolean {
    const value = localStorage.getItem(STORAGE_PREFIX + key);
    if (value === null) {
      return defaultValue;
    }
    return value === 'true';
  }

  private saveToStorage(key: string, value: string | boolean): void {
    localStorage.setItem(STORAGE_PREFIX + key, String(value));
  }

  getUri(): string {
    return this.uriParam;
  }

  setUri(uri: string): void {
    this.previousUriParam = this.uriParam;
    this.uriParam = uri;
    this.fromBrowserNavigation = false; // Mark as programmatic
    this.setLocationHash();

    if (this.previousUriParam !== uri) {
      this.uriSubject.next(this.uriParam);
    }
  }

  isFromBrowserNavigation(): boolean {
    const result = this.fromBrowserNavigation;
    this.fromBrowserNavigation = false; // Reset after check
    return result;
  }

  getTheme(): string {
    return this.themeParam;
  }

  setTheme(theme: string): void {
    this.themeParam = theme;
    this.saveToStorage('theme', theme);
    this.themeSubject.next(this.themeParam);
  }

  getColumnLayout(): string {
    return this.columnLayoutParam;
  }

  setColumnLayout(layout: string): void {
    if (layout !== '2' && layout !== '3') {
      console.error('Cannot set unknown layout: ' + layout);
      return;
    }
    this.columnLayoutParam = layout;
    this.saveToStorage('columnLayout', layout);
    this.layoutSubject.next(this.columnLayoutParam);
  }

  getHttpOptions(): boolean {
    return this.httpOptionsParam;
  }

  setHttpOptions(options: boolean): void {
    this.httpOptionsParam = options;
    this.saveToStorage('httpOptions', options);
    this.httpOptionsSubject.next(this.httpOptionsParam);
  }

  getAllHttpMethodsForLinks(): boolean {
    return this.allHttpMethodsForLinksParam;
  }

  setAllHttpMethodsForLinks(options: boolean): void {
    this.allHttpMethodsForLinksParam = options;
    this.saveToStorage('allHttpMethodsForLinks', options);
    this.allHttpMethodsForLinksSubject.next(this.allHttpMethodsForLinksParam);
  }

  getCustomRequestHeaders(): RequestHeader[] {
    return this.customRequestHeaders;
  }

  setCustomRequestHeaders(requestHeaders: RequestHeader[]): void {
    this.customRequestHeaders = requestHeaders;
    this.setLocationHash();
  }

  private handleLocationHash(): void {
    const previousUri = this.uriParam;
    const tempCustomRequestHeaders = this.parseLocationHashParameters();

    this.updateCustomRequestHeaders(tempCustomRequestHeaders);

    // Emit URI if it changed from browser navigation (back/forward buttons)
    if (previousUri !== this.uriParam) {
      this.fromBrowserNavigation = true; // Mark as browser navigation
      this.uriSubject.next(this.uriParam);
    }
  }

  private parseLocationHashParameters(): RequestHeader[] {
    const tempHeaders: RequestHeader[] = new Array(5);
    const fragment = location.hash.substring(1);
    const regex = /([^&=]+)=([^&]*)/g;
    let match = regex.exec(fragment);

    while (match) {
      const key = decodeURIComponent(match[1]);
      const value = decodeURIComponent(match[2]);

      if (key.startsWith('hkey')) {
        const index = Number(key.substring(4));
        tempHeaders[index] = tempHeaders[index] || new RequestHeader(undefined, undefined);
        tempHeaders[index].key = value;
      } else if (key.startsWith('hval')) {
        const index = Number(key.substring(4));
        tempHeaders[index] = tempHeaders[index] || new RequestHeader(undefined, undefined);
        tempHeaders[index].value = value;
      } else if (key === 'url' || key === 'uri') {
        // 'url' kept for backward compatibility, 'uri' is the new parameter
        this.uriParam = fragment.substring(fragment.indexOf(key + '=') + key.length + 1);
        break; // uri/url is always the last parameter
      }

      match = regex.exec(fragment);
    }

    return tempHeaders;
  }

  private updateCustomRequestHeaders(tempHeaders: RequestHeader[]): void {
    this.customRequestHeaders = [];
    let hasHeaders = false;

    for (let i = 0; i < 5; i++) {
      if (tempHeaders[i]?.key && tempHeaders[i]?.value) {
        this.customRequestHeaders.push(tempHeaders[i]);
        hasHeaders = true;
      }
    }

    if (hasHeaders) {
      this.requestHeadersSubject.next(this.customRequestHeaders);
    }
  }

  private setLocationHash(): void {
    const params: string[] = [];

    this.customRequestHeaders.forEach((header, index) => {
      params.push(`hkey${index}=${header.key}`, `hval${index}=${header.value}`);
    });

    if (this.uriParam) {
      params.push(`uri=${this.uriParam}`);
    }

    globalThis.location.hash = params.join('&');
  }
}
