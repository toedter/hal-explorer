import {Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs';


export class RequestHeader {
  constructor(public key: string, public value: string) {
  }
}

@Injectable({
  providedIn: 'root'
})
export class AppService {
  private uriParam: string;
  private themeParam: string;
  private layoutParam: string;
  private httpOptionsParam: boolean;
  private allHttpMethodsForLinksParam: boolean;

  private customRequestHeaders: RequestHeader[];

  private uriParamBackup: string;
  private themeParamBackup: string;
  private layoutParamBackup: string;
  private httpOptionsParamBackup: boolean;
  private allHttpMethodsForLinksParamBackup: boolean;

  private uriSubject: Subject<string> = new Subject<string>();
  private _uriObservable: Observable<string> = this.uriSubject.asObservable();

  private themeSubject: Subject<string> = new Subject<string>();
  private _themeObservable: Observable<string> = this.themeSubject.asObservable();

  private layoutSubject: Subject<string> = new Subject<string>();
  private _layoutObservable: Observable<string> = this.layoutSubject.asObservable();

  private httpOptionsSubject: Subject<boolean> = new Subject<boolean>();
  private _httpOptionsObservable: Observable<boolean> = this.httpOptionsSubject.asObservable();

  private allHttpMethodsForLinksSubject: Subject<boolean> = new Subject<boolean>();
  private _allHttpMethodsForLinksObservable: Observable<boolean> = this.allHttpMethodsForLinksSubject.asObservable();

  private requestHeadersSubject: Subject<RequestHeader[]> = new Subject<RequestHeader[]>();
  private _requestHeadersObservable: Observable<RequestHeader[]> = this.requestHeadersSubject.asObservable();

  private reactOnLocationHashChange = true;

  constructor() {
    this.handleLocationHash();
    window.addEventListener('hashchange', () => this.handleLocationHash(), false);
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

  get requestHeadersObservable(): Observable<RequestHeader[]> {
    return this._requestHeadersObservable;
  }

  getUri(): string {
    return this.uriParam;
  }

  setUri(uri: string, reactOnLocationHashChange: boolean = true) {
    this.reactOnLocationHashChange = reactOnLocationHashChange;
    this.uriParamBackup = this.uriParam;
    this.uriParam = uri;
    this.setLocationHash();
  }

  getTheme(): string {
    return this.themeParam;
  }

  setTheme(theme: string) {
    this.themeParamBackup = this.themeParam;
    this.themeParam = theme;
    this.setLocationHash();
  }

  getLayout(): string {
    return this.layoutParam;
  }

  setLayout(layout: string) {
    if (layout === '2' || layout === '3') {
      this.layoutParamBackup = this.layoutParam;
      this.layoutParam = layout;
      this.setLocationHash();
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
    this.setLocationHash();
  }

  getAllHttpMethodsForLinks(): boolean {
    return this.allHttpMethodsForLinksParam;
  }

  setAllHttpMethodsForLinks(options: boolean) {
    this.allHttpMethodsForLinksParamBackup = this.allHttpMethodsForLinksParam;
    this.allHttpMethodsForLinksParam = options;
    this.setLocationHash();
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

    if (!this.themeParam) {
      this.themeParam = 'Default';
    }

    if (!this.layoutParam) {
      this.layoutParam = '2';
    }

    if (!this.httpOptionsParam) {
      this.httpOptionsParam = false;
    }

    if (!this.allHttpMethodsForLinksParam) {
      this.allHttpMethodsForLinksParam = false;
    }

    const tempCustomRequestHeaders: RequestHeader[] = new Array(5);

    const fragment = location.hash.substring(1);
    const regex = /([^&=]+)=([^&]*)/g;
    let m = regex.exec(fragment);
    while (m) {
      const key = decodeURIComponent(m[1]);

      if (key === 'theme') {
        this.themeParam = decodeURIComponent(m[2]);
        m = regex.exec(fragment);
      } else if (key === 'layout') {
        this.layoutParam = decodeURIComponent(m[2]);
        m = regex.exec(fragment);
      } else if (key === 'httpOptions') {
        const httpOptionsValue = decodeURIComponent(m[2]);
        this.httpOptionsParam = (httpOptionsValue === 'true');
        m = regex.exec(fragment);
      } else if (key === 'allHttpMethodsForLinks') {
        const allHttpMethodsForLinksValue = decodeURIComponent(m[2]);
        this.allHttpMethodsForLinksParam = (allHttpMethodsForLinksValue === 'true');
        m = regex.exec(fragment);
      } else if (key.startsWith('hkey')) {
        const headerKeyParam = decodeURIComponent(m[2]);
        const headerKeyIndex: number = Number(key.substring(4));
        const requestHeader = tempCustomRequestHeaders[headerKeyIndex];
        if (requestHeader) {
          requestHeader.key = headerKeyParam;
        } else {
          tempCustomRequestHeaders[headerKeyIndex] = new RequestHeader(headerKeyParam, undefined);
        }
        m = regex.exec(fragment);
      } else if (key.startsWith('hval')) {
        const headerValueParam = decodeURIComponent(m[2]);
        const headerValueIndex: number = Number(key.substring(4));
        const requestHeader = tempCustomRequestHeaders[headerValueIndex];
        if (requestHeader) {
          requestHeader.value = headerValueParam;
        } else {
          tempCustomRequestHeaders[headerValueIndex] = new RequestHeader(undefined, headerValueParam);
        }
        m = regex.exec(fragment);
      } else if (key === 'url') { // keep this for backward compatibility
        this.uriParam = fragment.substring(fragment.indexOf('url=') + 4);
        m = null;
      } else if (key === 'uri') { // uri ist the new parameter that replaced url
        this.uriParam = fragment.substring(fragment.indexOf('uri=') + 4);
        m = null;
      } else {
        m = regex.exec(fragment);
      }
    }

    if (this.uriParamBackup !== this.uriParam) {
      this.uriSubject.next(this.uriParam);
    }

    if (this.themeParamBackup !== this.themeParam) {
      this.themeSubject.next(this.themeParam);
    }

    if (this.layoutParamBackup !== this.layoutParam) {
      this.layoutSubject.next(this.layoutParam);
    }

    if (this.httpOptionsParamBackup !== this.httpOptionsParam) {
      this.httpOptionsSubject.next(this.httpOptionsParam);
      this.uriSubject.next(this.uriParam);
    }

    if (this.allHttpMethodsForLinksParamBackup !== this.allHttpMethodsForLinksParam) {
      this.allHttpMethodsForLinksSubject.next(this.allHttpMethodsForLinksParam);
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

    if (this.themeParam.toLowerCase() !== 'default') {
      newLocationHash += andPrefix + 'theme=' + this.themeParam;
      andPrefix = '&';
    }

    if (this.layoutParam !== '2') {
      newLocationHash += andPrefix + 'layout=' + this.layoutParam;
      andPrefix = '&';
    }

    if (this.httpOptionsParam != false) {
      newLocationHash += andPrefix + 'httpOptions=' + this.httpOptionsParam;
      andPrefix = '&';
    }

    if (this.allHttpMethodsForLinksParam != false) {
      newLocationHash += andPrefix + 'allHttpMethodsForLinks=' + this.allHttpMethodsForLinksParam;
      andPrefix = '&';
    }

    for (let i = 0; i < this.customRequestHeaders.length; i++) {
      newLocationHash += andPrefix + 'hkey' + i + '=' + this.customRequestHeaders[i].key +
        '&' + 'hval' + i + '=' + this.customRequestHeaders[i].value;
      andPrefix = '&';
    }

    if (this.uriParam !== '') {
      newLocationHash += andPrefix + 'uri=' + this.uriParam;
    }

    window.location.hash = newLocationHash;
  }
}

