import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {Observable} from 'rxjs';


export class RequestHeader {
  constructor(public key: string, public value: string) {
  }
}

@Injectable()
export class AppService {
  private uriParam: string;
  private themeParam: string;
  private layoutParam: string;
  private customRequestHeaders: RequestHeader[];

  private uriParamBackup: string;
  private themeParamBackup: string;
  private layoutParamBackup: string;
  private customRequestHeadersBackup: RequestHeader[];

  private uriSubject: Subject<string> = new Subject<string>();
  // tslint:disable-next-line:variable-name
  private _uriObservable: Observable<string> = this.uriSubject.asObservable();

  private themeSubject: Subject<string> = new Subject<string>();
  // tslint:disable-next-line:variable-name
  private _themeObservable: Observable<string> = this.themeSubject.asObservable();

  private layoutSubject: Subject<string> = new Subject<string>();
  // tslint:disable-next-line:variable-name
  private _layoutObservable: Observable<string> = this.layoutSubject.asObservable();

  private requestHeadersSubject: Subject<RequestHeader[]> = new Subject<RequestHeader[]>();
  // tslint:disable-next-line:variable-name
  private _requestHeadersObservable: Observable<RequestHeader[]> = this.requestHeadersSubject.asObservable();

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

  get requestHeadersObservable(): Observable<RequestHeader[]> {
    return this._requestHeadersObservable;
  }

  getUri(): string {
    return this.uriParam;
  }

  setUri(uri: string) {
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

  getCustomRequestHeaders(): RequestHeader[] {
    return this.customRequestHeaders;
  }

  setCustomRequestHeaders(requestHeaders: RequestHeader[]) {
    this.customRequestHeadersBackup = this.customRequestHeaders.map(requestHeader => Object.assign({}, requestHeader));
    this.customRequestHeaders = requestHeaders;
    this.setLocationHash();
  }

  private handleLocationHash() {
    if (!this.uriParam) {
      this.uriParam = '';
    }
    if (!this.themeParam) {
      this.themeParam = 'Default';
    }
    if (!this.layoutParam) {
      this.layoutParam = '2';
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

