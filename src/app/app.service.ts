import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

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
  private uriParam: string;
  private themeParam: string;
  private layoutParam: string;
  private httpOptionsParam: boolean;
  private allHttpMethodsForLinksParam: boolean;
  private scrollableDocumentationParam: boolean;

  private customRequestHeaders: RequestHeader[];

  private uriParamBackup: string;
  private themeParamBackup: string;
  private layoutParamBackup: string;
  private httpOptionsParamBackup: boolean;
  private allHttpMethodsForLinksParamBackup: boolean;
  private scrollableDocumentationParamBackup: boolean;

  private readonly uriSubject: Subject<string> = new Subject<string>();
  private readonly _uriObservable: Observable<string> = this.uriSubject.asObservable();
  private readonly themeSubject: Subject<string> = new Subject<string>();
  private readonly _themeObservable: Observable<string> = this.themeSubject.asObservable();
  private readonly layoutSubject: Subject<string> = new Subject<string>();
  private readonly _layoutObservable: Observable<string> = this.layoutSubject.asObservable();
  private readonly httpOptionsSubject: Subject<boolean> = new Subject<boolean>();
  private readonly _httpOptionsObservable: Observable<boolean> = this.httpOptionsSubject.asObservable();
  private readonly allHttpMethodsForLinksSubject: Subject<boolean> = new Subject<boolean>();
  private readonly _allHttpMethodsForLinksObservable: Observable<boolean> =
    this.allHttpMethodsForLinksSubject.asObservable();
  private readonly scrollableDocumentationSubject: Subject<boolean> = new Subject<boolean>();
  private readonly _scrollableDocumentationObservable: Observable<boolean> =
    this.scrollableDocumentationSubject.asObservable();
  private readonly requestHeadersSubject: Subject<RequestHeader[]> = new Subject<RequestHeader[]>();
  private readonly _requestHeadersObservable: Observable<RequestHeader[]> = this.requestHeadersSubject.asObservable();

  private reactOnLocationHashChange = true;

  constructor() {
    this.initializeFromLocalStorage();
    this.handleLocationHash();
    window.addEventListener('hashchange', () => this.handleLocationHash(), false);
  }

  private initializeFromLocalStorage(): void {
    // Load settings from localStorage
    const storedTheme = localStorage.getItem('hal-explorer.theme');
    this.themeParam = storedTheme || 'Default';
    this.themeParamBackup = this.themeParam;

    const storedLayout = localStorage.getItem('hal-explorer.layout');
    this.layoutParam = storedLayout || '2';
    this.layoutParamBackup = this.layoutParam;

    const storedHttpOptions = localStorage.getItem('hal-explorer.httpOptions');
    this.httpOptionsParam = storedHttpOptions === 'true';
    this.httpOptionsParamBackup = this.httpOptionsParam;

    const storedAllHttpMethodsForLinks = localStorage.getItem('hal-explorer.allHttpMethodsForLinks');
    this.allHttpMethodsForLinksParam = storedAllHttpMethodsForLinks === 'true';
    this.allHttpMethodsForLinksParamBackup = this.allHttpMethodsForLinksParam;

    const storedScrollableDocumentation = localStorage.getItem('hal-explorer.scrollableDocumentation');
    this.scrollableDocumentationParam = storedScrollableDocumentation === 'true';
    this.scrollableDocumentationParamBackup = this.scrollableDocumentationParam;
  }

  get uriObservable(): Observable<string> {
    return this._uriObservable;
  }

  get themeObservable(): Observable<string> {
    return this._themeObservable;
  }

  get layoutObservable(): Observable<string> {
    return this._layoutObservable;
  }

  get httpOptionsObservable(): Observable<boolean> {
    return this._httpOptionsObservable;
  }

  get allHttpMethodsForLinksObservable(): Observable<boolean> {
    return this._allHttpMethodsForLinksObservable;
  }

  get scrollableDocumentationObservable(): Observable<boolean> {
    return this._scrollableDocumentationObservable;
  }

  get requestHeadersObservable(): Observable<RequestHeader[]> {
    return this._requestHeadersObservable;
  }

  getUri(): string {
    return this.uriParam;
  }

  setUri(uri: string, reactOnLocationHashChange = true) {
    this.reactOnLocationHashChange = reactOnLocationHashChange;
    const previousUri = this.uriParam;
    this.uriParamBackup = this.uriParam;
    this.uriParam = uri;
    this.setLocationHash();

    // Emit the URI change immediately if it changed, even when reactOnLocationHashChange is false
    // This ensures the input field gets updated when clicking links
    if (previousUri !== uri) {
      this.uriSubject.next(this.uriParam);
    }
  }

  getTheme(): string {
    return this.themeParam;
  }

  setTheme(theme: string) {
    this.themeParamBackup = this.themeParam;
    this.themeParam = theme;
    localStorage.setItem('hal-explorer.theme', theme);
    this.themeSubject.next(this.themeParam);
  }

  getLayout(): string {
    return this.layoutParam;
  }

  setLayout(layout: string) {
    if (layout === '2' || layout === '3') {
      this.layoutParamBackup = this.layoutParam;
      this.layoutParam = layout;
      localStorage.setItem('hal-explorer.layout', layout);
      this.layoutSubject.next(this.layoutParam);
    } else {
      console.error('Cannot set unknown layout: ' + layout);
    }
  }

  getHttpOptions(): boolean {
    return this.httpOptionsParam;
  }

  setHttpOptions(options: boolean) {
    this.httpOptionsParamBackup = this.httpOptionsParam;
    this.httpOptionsParam = options;
    localStorage.setItem('hal-explorer.httpOptions', String(options));
    this.httpOptionsSubject.next(this.httpOptionsParam);
    this.uriSubject.next(this.uriParam);
  }

  getAllHttpMethodsForLinks(): boolean {
    return this.allHttpMethodsForLinksParam;
  }

  setAllHttpMethodsForLinks(options: boolean) {
    this.allHttpMethodsForLinksParamBackup = this.allHttpMethodsForLinksParam;
    this.allHttpMethodsForLinksParam = options;
    localStorage.setItem('hal-explorer.allHttpMethodsForLinks', String(options));
    this.allHttpMethodsForLinksSubject.next(this.allHttpMethodsForLinksParam);
  }

  getScrollableDocumentation(): boolean {
    return this.scrollableDocumentationParam;
  }

  setScrollableDocumentation(scrollable: boolean) {
    this.scrollableDocumentationParamBackup = this.scrollableDocumentationParam;
    this.scrollableDocumentationParam = scrollable;
    localStorage.setItem('hal-explorer.scrollableDocumentation', String(scrollable));
    this.scrollableDocumentationSubject.next(this.scrollableDocumentationParam);
  }

  getCustomRequestHeaders(): RequestHeader[] {
    return this.customRequestHeaders;
  }

  setCustomRequestHeaders(requestHeaders: RequestHeader[]) {
    this.customRequestHeaders = requestHeaders;
    this.setLocationHash();
  }

  private handleLocationHash() {
    if (!this.reactOnLocationHashChange) {
      this.reactOnLocationHashChange = true;
      return;
    }

    if (!this.uriParam) {
      this.uriParam = '';
    }

    const tempCustomRequestHeaders: RequestHeader[] = new Array(5);

    const fragment = location.hash.substring(1);
    const regex = /([^&=]+)=([^&]*)/g;
    let m = regex.exec(fragment);
    while (m) {
      const key = decodeURIComponent(m[1]);

      if (key.startsWith('hkey')) {
        const headerKeyParam = decodeURIComponent(m[2]);
        const headerKeyIndex = Number(key.substring(4));
        const requestHeader = tempCustomRequestHeaders[headerKeyIndex];
        if (requestHeader) {
          requestHeader.key = headerKeyParam;
        } else {
          tempCustomRequestHeaders[headerKeyIndex] = new RequestHeader(headerKeyParam, undefined);
        }
        m = regex.exec(fragment);
      } else if (key.startsWith('hval')) {
        const headerValueParam = decodeURIComponent(m[2]);
        const headerValueIndex = Number(key.substring(4));
        const requestHeader = tempCustomRequestHeaders[headerValueIndex];
        if (requestHeader) {
          requestHeader.value = headerValueParam;
        } else {
          tempCustomRequestHeaders[headerValueIndex] = new RequestHeader(undefined, headerValueParam);
        }
        m = regex.exec(fragment);
      } else if (key === 'url') {
        // keep this for backward compatibility
        this.uriParam = fragment.substring(fragment.indexOf('url=') + 4);
        m = null;
      } else if (key === 'uri') {
        // uri ist the new parameter that replaced url
        this.uriParam = fragment.substring(fragment.indexOf('uri=') + 4);
        m = null;
      } else {
        // Skip unknown parameters (for backward compatibility with old URLs that have theme, layout, etc.)
        m = regex.exec(fragment);
      }
    }

    if (this.uriParamBackup !== this.uriParam) {
      this.uriSubject.next(this.uriParam);
    }

    this.customRequestHeaders = [];
    let publishRequestHeaders = false;
    for (let i = 0; i < 5; i++) {
      if (tempCustomRequestHeaders[i] && tempCustomRequestHeaders[i].key && tempCustomRequestHeaders[i].value) {
        this.customRequestHeaders.push(tempCustomRequestHeaders[i]);
        publishRequestHeaders = true;
      }
    }

    if (publishRequestHeaders) {
      this.requestHeadersSubject.next(this.customRequestHeaders);
    }
  }

  private setLocationHash() {
    let newLocationHash = '';
    let andPrefix = '';

    for (let i = 0; i < this.customRequestHeaders.length; i++) {
      newLocationHash +=
        andPrefix +
        'hkey' +
        i +
        '=' +
        this.customRequestHeaders[i].key +
        '&' +
        'hval' +
        i +
        '=' +
        this.customRequestHeaders[i].value;
      andPrefix = '&';
    }

    if (this.uriParam !== '') {
      newLocationHash += andPrefix + 'uri=' + this.uriParam;
    }

    globalThis.location.hash = newLocationHash;
  }
}
