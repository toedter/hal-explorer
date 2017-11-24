import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpResponse} from '@angular/common/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import * as utpl from 'uri-templates';
import {URITemplate} from 'uri-templates';

export enum EventType {FillUriTemplate, FillHttpRequest}

export enum Command {Get, Post, Put, Patch, Delete, Document}

@Injectable()
export class RequestService {

  private httpResponse: HttpResponse<any>;
  private responseSubject: Subject<HttpResponse<any>> = new Subject<HttpResponse<any>>();
  private responseObservable: Observable<HttpResponse<any>> = this.responseSubject.asObservable();

  private needInfoSubject: Subject<any> = new Subject<any>();
  private needInfoObservable: Observable<any> = this.needInfoSubject.asObservable();

  private defaultHeaders: HttpHeaders = new HttpHeaders(
    {
      'Accept': 'application/hal+json, application/json, */*'
    });

  constructor(private http: HttpClient) {
  }

  public getResponseObservable(): Observable<HttpResponse<any>> {
    return this.responseObservable;
  }

  public getNeedInfoObservable(): Observable<string> {
    return this.needInfoObservable;
  }

  public getUri(uri: string) {
    this.processCommand(Command.Get, uri);
  }

  public postUri(uri: string, body: string) {
    const jsonObjectBody = JSON.parse(body);

    this.http.post(uri, jsonObjectBody, {headers: this.defaultHeaders, observe: 'response'}).subscribe(
      (response: HttpResponse<any>) => {
        const location = response.headers.get('location');
        if (location) {
          window.location.hash = location;
        }
        this.httpResponse = response;
        this.responseSubject.next(response);
      },
      err => {
        console.log('Error occured: ' + err.message);
      }
    );
  }

  public processCommand(command: Command, uri: string) {

    if (command === Command.Get) {
      if (uri.includes('{')) {
        const uriTemplate: URITemplate = utpl(uri);
        const uriTemplateParameters: UrlTemplateParameter[] = new Array();
        for (const param of (<any>uriTemplate).varNames) {
          uriTemplateParameters.push(new UrlTemplateParameter(param, ''));
        }

        const event = new UriTemplateEvent(EventType.FillUriTemplate, uri, uriTemplateParameters);
        this.needInfoSubject.next(event);
        return;
      }


      this.http.get(uri, {headers: this.defaultHeaders, observe: 'response'}).subscribe(
        (response: HttpResponse<any>) => {
          window.location.hash = uri;
          this.httpResponse = response;
          this.responseSubject.next(response);
        },
        err => {
          console.log('Error occured: ' + err.message);
        }
      );
    } else if (command === Command.Post) {
      if (uri.includes('{')) {
        uri = uri.substring(0, uri.indexOf('{'));
      }
      const event = new HttpRequestEvent(EventType.FillHttpRequest, Command.Post, uri);
      this.needInfoSubject.next(event);
      return;

    } else {
      console.log(('got Command: ' + command));
    }
  }
}

export class UriTemplateEvent {
  constructor(public type: EventType, public templatedUrl, public parameters: UrlTemplateParameter[]) {
  }
}

export class HttpRequestEvent {
  constructor(public type: EventType, public command: Command, public uri: string) {
  }
}

export class UrlTemplateParameter {
  constructor(public key: string, public value: string) {
  }
}
