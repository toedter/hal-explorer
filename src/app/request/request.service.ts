import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import utpl, { URITemplate } from 'uri-templates';
import { AppService, RequestHeader } from '../app.service';
import { Link } from '../response-explorer/response-explorer.component';

const DEFAULT_ACCEPT_HEADER = 'application/prs.hal-forms+json, application/hal+json, application/json, */*';

export enum EventType {
  FillHttpRequest,
}

export enum Command {
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Document,
}

export class HttpRequestEvent {
  constructor(
    public type: EventType,
    public command: Command,
    public uri: string,
    public jsonSchema?: any,
    public halFormsTemplate?: any
  ) {}
}

export class UriTemplateParameter {
  constructor(
    public key: string,
    public value: string
  ) {}
}

export class Response {
  constructor(
    public httpResponse: HttpResponse<any>,
    public httpErrorResponse: HttpErrorResponse
  ) {}
}

@Injectable({
  providedIn: 'root',
})
export class RequestService {
  private readonly responseSubject = new Subject<Response>();
  private readonly needInfoSubject = new Subject<any>();
  private readonly documentationSubject = new Subject<string>();
  private readonly loadingSubject = new Subject<boolean>();

  private requestHeaders = new HttpHeaders({ Accept: DEFAULT_ACCEPT_HEADER });
  private customRequestHeaders: RequestHeader[] = [];

  private readonly appService = inject(AppService);
  private readonly http = inject(HttpClient);

  getResponseObservable(): Observable<Response> {
    return this.responseSubject.asObservable();
  }

  getNeedInfoObservable(): Observable<any> {
    return this.needInfoSubject.asObservable();
  }

  getDocumentationObservable(): Observable<string> {
    return this.documentationSubject.asObservable();
  }

  getLoadingObservable(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  getUri(uri: string): void {
    if (!uri?.trim()) {
      return;
    }
    this.processCommand(Command.Get, uri);
  }

  requestUri(uri: string, httpMethod: string, body?: string, contentType?: string): void {
    this.setLoading(true);
    let headers = this.requestHeaders;

    const requiresContentType = contentType || ['post', 'put', 'patch'].includes(httpMethod.toLowerCase());

    if (requiresContentType) {
      headers = headers.set('Content-Type', contentType || 'application/json; charset=utf-8');
    } else {
      this.appService.setUri(uri);
    }

    this.http.request(httpMethod, uri, { headers, observe: 'response', body }).subscribe({
      next: (response: HttpResponse<any>) => {
        this.responseSubject.next(new Response(response, null));
        this.setLoading(false);
      },
      error: (error: HttpErrorResponse) => {
        this.responseSubject.next(new Response(null, error));
        this.setLoading(false);
      },
    });
  }

  processCommand(command: Command, uri: string, halFormsTemplate?: any): void {
    if (command === Command.Document) {
      this.documentationSubject.next(uri);
      return;
    }

    if (command === Command.Delete) {
      this.requestUri(this.expandUriTemplate(uri), 'DELETE');
      return;
    }

    if (command === Command.Get && !this.isUriTemplated(uri) && !halFormsTemplate) {
      this.requestUri(uri, 'GET');
      return;
    }

    if ([Command.Get, Command.Post, Command.Put, Command.Patch].includes(command)) {
      const event = new HttpRequestEvent(EventType.FillHttpRequest, command, uri);
      if (halFormsTemplate || command === Command.Get) {
        event.halFormsTemplate = halFormsTemplate;
        this.needInfoSubject.next(event);
      } else {
        this.getJsonSchema(event);
      }
    }
  }

  getJsonSchema(httpRequestEvent: HttpRequestEvent): void {
    const uri = this.expandUriTemplate(httpRequestEvent.uri);

    this.http.request('HEAD', uri, { headers: this.requestHeaders, observe: 'response' }).subscribe({
      next: (response: HttpResponse<any>) => {
        const profileUri = this.extractProfileUri(response.headers.get('link'));

        if (profileUri) {
          this.fetchJsonSchema(profileUri, httpRequestEvent);
        } else {
          this.needInfoSubject.next(httpRequestEvent);
        }
      },
      error: () => {
        console.warn('Cannot get JSON schema information for: ', uri);
        this.needInfoSubject.next(httpRequestEvent);
      },
    });
  }

  private extractProfileUri(linkHeader: string | null): string | null {
    if (!linkHeader) return null;

    const w3cLinks = linkHeader.split(',');
    const relPattern = /rel="([^"]+)"/;

    for (const w3cLink of w3cLinks) {
      const parts = w3cLink.split(';');
      const href = parts[0].slice(1, -1); // Remove < and >
      const relPart = parts[1];

      if (relPart) {
        const relMatch = relPattern.exec(relPart);
        if (relMatch && relMatch[1].toLowerCase() === 'profile') {
          return href;
        }
      }
    }
    return null;
  }

  private fetchJsonSchema(profileUri: string, httpRequestEvent: HttpRequestEvent): void {
    let headers = new HttpHeaders({ Accept: 'application/schema+json' });

    for (const requestHeader of this.customRequestHeaders) {
      headers = headers.append(requestHeader.key, requestHeader.value);
    }

    this.http.get(profileUri, { headers, observe: 'response' }).subscribe({
      next: (httpResponse: HttpResponse<any>) => {
        const jsonSchema = httpResponse.body;
        this.removeReadOnlyProperties(jsonSchema);
        httpRequestEvent.jsonSchema = jsonSchema;
        this.needInfoSubject.next(httpRequestEvent);
      },
      error: () => {
        console.warn('Cannot get JSON schema for: ', profileUri);
        this.needInfoSubject.next(httpRequestEvent);
      },
    });
  }

  private removeReadOnlyProperties(jsonSchema: any): void {
    if (!jsonSchema?.properties) return;

    Object.keys(jsonSchema.properties).forEach(property => {
      if (jsonSchema.properties[property]?.readOnly === true) {
        delete jsonSchema.properties[property];
      }
    });
  }

  setCustomHeaders(requestHeaders: RequestHeader[]): void {
    this.customRequestHeaders = requestHeaders;
    this.requestHeaders = new HttpHeaders();

    let hasAcceptHeader = false;
    for (const requestHeader of requestHeaders) {
      if (requestHeader.key.toLowerCase() === 'accept') {
        hasAcceptHeader = true;
      }
      this.requestHeaders = this.requestHeaders.append(requestHeader.key, requestHeader.value);
    }

    if (!hasAcceptHeader) {
      this.requestHeaders = this.requestHeaders.append('Accept', DEFAULT_ACCEPT_HEADER);
    }
  }

  getInputType(jsonSchemaType: string, jsonSchemaFormat?: string): string {
    if (jsonSchemaType.toLowerCase() === 'integer') {
      return 'number';
    }

    if (jsonSchemaType.toLowerCase() === 'string') {
      if (jsonSchemaFormat?.toLowerCase() === 'uri') {
        return 'url';
      }
      return 'text';
    }

    return 'text';
  }

  isUriTemplated(uri: string): boolean {
    const uriTemplate = utpl(uri);
    return uriTemplate.varNames.length > 0;
  }

  private expandUriTemplate(uri: string): string {
    if (!this.isUriTemplated(uri)) {
      return uri;
    }
    const uriTemplate: URITemplate = utpl(uri);
    return uriTemplate.fill({});
  }

  computeHalFormsOptionsFromLink(property: any): void {
    if (!property.options?.link?.href) {
      return;
    }

    let headers = new HttpHeaders().set('Accept', 'application/json');

    if (property.options.link.type) {
      headers = headers.set('Accept', property.options.link.type);
    }

    const href = this.expandUriTemplate(property.options.link.href);

    this.http.get(href, { headers, observe: 'response' }).subscribe((response: HttpResponse<any>) => {
      const contentType = response.headers.get('content-type');
      const isHalContent =
        contentType &&
        (contentType.startsWith('application/prs.hal-forms+json') || contentType.startsWith('application/hal+json'));

      if (isHalContent && response.body?._embedded) {
        const embeddedKey = Object.keys(response.body._embedded)[0];
        property.options.inline = response.body._embedded[embeddedKey];
      } else {
        property.options.inline = response.body;
      }
    });
  }

  getHttpOptions(link: Link): void {
    const href = this.expandUriTemplate(link.href);
    const headers = new HttpHeaders().set('Accept', '*/*');

    this.http.options(href, { headers, observe: 'response' }).subscribe({
      next: (httpResponse: HttpResponse<any>) => {
        link.options = httpResponse.headers.get('allow');
      },
      error: () => {
        console.warn('Cannot get OPTIONS for: ', link);
        link.options = 'http-options-error';
      },
    });
  }
}
