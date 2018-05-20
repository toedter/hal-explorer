import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {Observable} from 'rxjs';


export class RequestHeader {
  constructor(public key: string, public value: string) {
  }
}

@Injectable()
export class AppService {
  private urlParam: string;
  private themeParam: string;
  private layoutParam: string;
  private customRequestHeaders: RequestHeader[];

  private urlParamBackup: string;
  private themeParamBackup: string;
  private layoutParamBackup: string;
  private customRequestHeadersBackup: RequestHeader[];

  private urlSubject: Subject<string> = new Subject<string>();
  private _urlObservable: Observable<string> = this.urlSubject.asObservable();

  private themeSubject: Subject<string> = new Subject<string>();
  private _themeObservable: Observable<string> = this.themeSubject.asObservable();

  private layoutSubject: Subject<string> = new Subject<string>();
  private _layoutObservable: Observable<string> = this.layoutSubject.asObservable();

  private requestHeadersSubject: Subject<RequestHeader[]> = new Subject<RequestHeader[]>();
  private _requestHeadersObservable: Observable<RequestHeader[]> = this.requestHeadersSubject.asObservable();

  constructor() {
    this.handleLocationHash();
    window.addEventListener('hashchange', () => this.handleLocationHash(), false);
  }

  get urlObservable(): Observable<string> {
    return this._urlObservable;
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

  getUrl(): string {
    return this.urlParam;
  }

  setUrl(url: string) {
    this.urlParamBackup = this.urlParam;
    this.urlParam = url;
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
    if (!this.urlParam) {
      this.urlParam = '';
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
          tempCustomRequestHeaders[headerKeyIndex] = new RequestHeader(headerKeyParam, '');
        }
        m = regex.exec(fragment);
      } else if (key.startsWith('hval')) {
        const headerValueParam = decodeURIComponent(m[2]);
        const headerValueIndex: number = Number(key.substring(4));
        const requestHeader = tempCustomRequestHeaders[headerValueIndex];
        if (requestHeader) {
          requestHeader.value = headerValueParam;
        } else {
          console.log('error in fragment parameters: found request header value' + headerValueParam + ' without corresponding key');
        }
        m = regex.exec(fragment);
      } else if (key === 'url') {
        this.urlParam = fragment.substring(fragment.indexOf('url=') + 4);
        m = null;
      }
    }

    if (this.urlParamBackup !== this.urlParam) {
      this.urlSubject.next(this.urlParam);
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
      if (tempCustomRequestHeaders[i] && tempCustomRequestHeaders[i].key && tempCustomRequestHeaders[i].value.length > 0) {
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

    if (this.urlParam !== '') {
      newLocationHash += andPrefix + 'url=' + this.urlParam;
    }

    window.location.hash = newLocationHash;
  }
}

