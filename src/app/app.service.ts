import {Injectable} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';

@Injectable()
export class AppService {
  private urlParam: string;
  private themeParam: string;
  private layoutParam: string;

  private urlParamBackup: string;
  private themeParamBackup: string;
  private layoutParamBackup: string;

  private urlSubject: Subject<string> = new Subject<string>();
  private _urlObservable: Observable<string> = this.urlSubject.asObservable();

  private themeSubject: Subject<string> = new Subject<string>();
  private _themeObservable: Observable<string> = this.themeSubject.asObservable();

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

  getUrl(): string {
    return this.urlParam;
  }

  setUrl(url: string) {
    this.urlParamBackup = this.urlParam;
    this.urlParam = url;
    this.setLocationHash();
  }

  getTheme() {
    return this.themeParam;
  }

  setTheme(theme: string) {
    this.themeParamBackup = this.themeParam;
    this.themeParam = theme;
    this.setLocationHash();
  }

  private handleLocationHash() {
    if (!this.urlParam) {
      this.urlParam = 'http://localhost:8080/api';
    }
    if (!this.themeParam) {
      this.themeParam = 'Default';
    }
    if (!this.layoutParam) {
      this.layoutParam = '2';
    }

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
  }

  private setLocationHash() {
    window.location.hash = 'theme=' + this.themeParam + '&layout=' + this.layoutParam + '&url=' + this.urlParam;
  }
}
