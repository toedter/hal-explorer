import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpResponse} from '@angular/common/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {URITemplate} from 'uri-templates';
import * as utpl from 'uri-templates';

export enum EventType { NeedUrlTemplate}

@Injectable()
export class CallerService {

  private httpResponse: HttpResponse<any>;
  private responseSubject: Subject<HttpResponse<any>> = new Subject<HttpResponse<any>>();
  private responseObservable: Observable<HttpResponse<any>> = this.responseSubject.asObservable();

  private needInfoSubject: Subject<any> = new Subject<any>();
  private needInfoObservable: Observable<any> = this.needInfoSubject.asObservable();

  constructor(private http: HttpClient) {
  }

  public getResponseObservable(): Observable<HttpResponse<any>> {
    return this.responseObservable;
  }

  public getNeedInfoObservable(): Observable<string> {
    return this.needInfoObservable;
  }

  public callURL(url: string) {
    const myHeaders: HttpHeaders = new HttpHeaders(
      {
        'Accept': 'application/hal+json, application/json, */*'
      });

    if (url.includes('{')) {
      const uriTemplate: URITemplate = utpl(url);
      const uriTemplateParameters: UrlTemplateParameter[] = new Array();
      for (const param of (<any>uriTemplate).varNames) {
        uriTemplateParameters.push(new UrlTemplateParameter(param, ''));
      }

      const event = new UrlTemplateEvent(EventType.NeedUrlTemplate, url, uriTemplateParameters);
      this.needInfoSubject.next(event);
      return;
    }

    this.http.get(url, {headers: myHeaders, observe: 'response'}).subscribe(
      (response: HttpResponse<any>) => {
        window.location.hash = url;
        this.httpResponse = response;
        this.responseSubject.next(response);
      },
      err => {
        console.log('Error occured:' + err.toString());
      }
    );
  }
}

export class UrlTemplateEvent {
  constructor(public type: EventType, public templatedUrl, public parameters: UrlTemplateParameter[]) {
  }
}

export class UrlTemplateParameter {
  constructor(public key: string, public value: string) {
  }
}
