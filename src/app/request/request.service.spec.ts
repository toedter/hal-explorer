import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Command, HttpRequestEvent, RequestService, Response } from './request.service';
import { AppService, RequestHeader } from '../app.service';
import { HttpClient, HttpHeaders, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { Type } from '@angular/core';
import { Link } from '../response-explorer/response-explorer.component';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('RequestService', () => {
  let requestService: RequestService;
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        RequestService,
        AppService,
        HttpClient,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    requestService = TestBed.inject(RequestService);
    httpMock = TestBed.inject(HttpTestingController as Type<HttpTestingController>);
    httpClient = TestBed.inject(HttpClient);
  });

  it('should be created', () => {
    expect(requestService).toBeTruthy();
  });

  it('should return correct input type', () => {
    expect(requestService.getInputType('string')).toBe('text');
    expect(requestService.getInputType('string', 'uri')).toBe('url');
    expect(requestService.getInputType('string', 'something else')).toBe('text');
    expect(requestService.getInputType('integer')).toBe('number');
    expect(requestService.getInputType('something else')).toBe('text');
  });

  it('should not make request with empty URI', () => {
    requestService.getUri('');
    httpMock.expectNone('');

    requestService.getUri('   ');
    httpMock.expectNone('   ');

    // Verify no unexpected requests were made
    httpMock.verify();
    expect(true).toBe(true); // Assertion to satisfy linter
  });

  it('should set default accept request header', async () => {
    const responsePromise = new Promise<Response>(resolve => {
      requestService.getResponseObservable().subscribe((response: Response) => {
        resolve(response);
      });
    });

    requestService.getUri('test-request');

    const testRequest = httpMock.expectOne('test-request');
    testRequest.flush('body');

    expect(testRequest.request.headers.keys()).toContain('Accept');

    const response = await responsePromise;
    expect(response.httpResponse.body).toBe('body');

    httpMock.verify();
  });

  it('should not set default accept request header when custom accept header exists', async () => {
    const responsePromise = new Promise<Response>(resolve => {
      requestService.getResponseObservable().subscribe((response: Response) => {
        resolve(response);
      });
    });

    const customAcceptHeader = new RequestHeader('Accept', 'foo/bar');

    requestService.setCustomHeaders([customAcceptHeader]);
    requestService.getUri('test-request');

    const testRequest = httpMock.expectOne('test-request');
    testRequest.flush('body');

    expect(testRequest.request.headers.keys()).toContain('Accept');
    expect(testRequest.request.headers.keys().length).toBe(1);
    expect(testRequest.request.headers.get('Accept')).toBe('foo/bar');

    const response = await responsePromise;
    expect(response.httpResponse.body).toBe('body');

    httpMock.verify();
  });

  it('should set Content-Type request header for POST request with default content type', async () => {
    const responsePromise = new Promise<Response>(resolve => {
      requestService.getResponseObservable().subscribe((response: Response) => {
        resolve(response);
      });
    });

    requestService.requestUri('test-request', 'POST', 'body');

    const testRequest = httpMock.expectOne('test-request');
    testRequest.flush('body');

    expect(testRequest.request.headers.keys()).toContain('Content-Type');
    expect(testRequest.request.headers.get('Content-Type')).toBe('application/json; charset=utf-8');

    const response = await responsePromise;
    expect(response.httpResponse.body).toBe('body');

    httpMock.verify();
  });

  it('should set Content-Type request header for POST request with specified content type', async () => {
    const responsePromise = new Promise<Response>(resolve => {
      requestService.getResponseObservable().subscribe((response: Response) => {
        resolve(response);
      });
    });

    requestService.requestUri('test-request', 'POST', 'body', 'myContentType');

    const testRequest = httpMock.expectOne('test-request');
    testRequest.flush('body');

    expect(testRequest.request.headers.keys()).toContain('Content-Type');
    expect(testRequest.request.headers.get('Content-Type')).toBe('myContentType');

    const response = await responsePromise;
    expect(response.httpResponse.body).toBe('body');

    httpMock.verify();
  });

  it('should process Get command', async () => {
    const responsePromise = new Promise<Response>(resolve => {
      requestService.getResponseObservable().subscribe((response: Response) => {
        resolve(response);
      });
    });

    requestService.processCommand(Command.Get, 'test-request');

    const testRequest = httpMock.expectOne('test-request');
    testRequest.flush('body');

    expect(testRequest.request.method).toBe('GET');

    const response = await responsePromise;
    expect(response.httpResponse.body).toBe('body');

    httpMock.verify();
  });

  it('should process Post command', async () => {
    const eventPromise = new Promise<HttpRequestEvent>(resolve => {
      requestService.getNeedInfoObservable().subscribe((event: HttpRequestEvent) => {
        resolve(event);
      });
    });

    requestService.processCommand(Command.Post, 'test-request');

    const testRequest = httpMock.expectOne('test-request');
    testRequest.flush('body');

    // first do a head request to figure out if there are available profiles
    expect(testRequest.request.method).toBe('HEAD');

    const event = await eventPromise;
    expect(event.jsonSchema).toBeUndefined();

    httpMock.verify();
  });

  it('should handle HTTP request error', async () => {
    const body = 'Invalid request parameters';
    const responsePromise = new Promise<Response>(resolve => {
      requestService.getResponseObservable().subscribe((response: Response) => {
        resolve(response);
      });
    });

    requestService.processCommand(Command.Get, 'test-request');

    const mockErrorResponse = {
      status: 404,
      statusText: 'Not Found',
    };
    httpMock.expectOne('test-request').flush(body, mockErrorResponse);

    const response = await responsePromise;
    expect(response.httpErrorResponse.status).toBe(404);
    expect(response.httpErrorResponse.statusText).toBe('Not Found');

    httpMock.verify();
  });

  it('should handle HTTP request error with ErrorEvent', () => {
    vi.spyOn(window.console, 'error');
    const errorEvent: ErrorEvent = new ErrorEvent('MyError');
    requestService.processCommand(Command.Get, 'test-request');

    const mockErrorResponse = {
      status: 404,
      statusText: 'Not Found',
    };
    httpMock.expectOne('test-request').flush(errorEvent, mockErrorResponse);
    expect(window.console.error).not.toHaveBeenCalled();
  });

  it('should handle templated URIs', async () => {
    const eventPromise = new Promise<HttpRequestEvent>(resolve => {
      requestService.getNeedInfoObservable().subscribe((event: any) => {
        resolve(event as HttpRequestEvent);
      });
    });

    requestService.processCommand(Command.Get, 'http://localhost{?page}');

    const event = await eventPromise;
    expect(event.uri).toBe('http://localhost{?page}');
  });

  it('should process document command', async () => {
    const docPromise = new Promise<string>(resolve => {
      requestService.getDocumentationObservable().subscribe((docUrl: string) => {
        resolve(docUrl);
      });
    });

    requestService.processCommand(Command.Document, 'http://doc');

    const docUrl = await docPromise;
    expect(docUrl).toBe('http://doc');
  });

  it('should emit loading state during request', async () => {
    const loadingStates: boolean[] = [];

    const loadingPromise = new Promise<void>(resolve => {
      requestService.getLoadingObservable().subscribe((loading: boolean) => {
        loadingStates.push(loading);

        // After request completes, we should have [true, false]
        if (loadingStates.length === 2) {
          resolve();
        }
      });
    });

    requestService.getUri('test-request');

    const testRequest = httpMock.expectOne('test-request');
    testRequest.flush('body');

    await loadingPromise;

    expect(loadingStates[0]).toBe(true); // Loading started
    expect(loadingStates[1]).toBe(false); // Loading finished

    httpMock.verify();
  });

  it('should process Put command', async () => {
    const eventPromise = new Promise<HttpRequestEvent>(resolve => {
      requestService.getNeedInfoObservable().subscribe((event: HttpRequestEvent) => {
        resolve(event);
      });
    });

    requestService.processCommand(Command.Put, 'http://localhost/resource');

    // PUT commands trigger JSON schema fetch via HEAD request
    const headRequest = httpMock.expectOne('http://localhost/resource');
    expect(headRequest.request.method).toBe('HEAD');

    // Respond with no Link header, so it goes to needInfoSubject
    headRequest.flush(null);

    const event = await eventPromise;
    expect(event.command).toBe(Command.Put);
    expect(event.uri).toBe('http://localhost/resource');

    httpMock.verify();
  });

  it('should process Patch command', async () => {
    const eventPromise = new Promise<HttpRequestEvent>(resolve => {
      requestService.getNeedInfoObservable().subscribe((event: HttpRequestEvent) => {
        resolve(event);
      });
    });

    requestService.processCommand(Command.Patch, 'http://localhost/resource');

    // PATCH commands trigger JSON schema fetch via HEAD request
    const headRequest = httpMock.expectOne('http://localhost/resource');
    expect(headRequest.request.method).toBe('HEAD');

    // Respond with no Link header, so it goes to needInfoSubject
    headRequest.flush(null);

    const event = await eventPromise;
    expect(event.command).toBe(Command.Patch);
    expect(event.uri).toBe('http://localhost/resource');

    httpMock.verify();
  });

  it('should process delete command', async () => {
    const responsePromise = new Promise<Response>(resolve => {
      requestService.getResponseObservable().subscribe((response: Response) => {
        resolve(response);
      });
    });

    requestService.processCommand(Command.Delete, 'test-request{template}');

    const testRequest = httpMock.expectOne('test-request');
    testRequest.flush(null, { status: 204, statusText: 'No Content' });

    expect(testRequest.request.method).toBe('DELETE');

    const response = await responsePromise;
    expect(response.httpResponse.status).toBe(204);

    httpMock.verify();
  });

  it('should process json schema', async () => {
    const eventPromise = new Promise<HttpRequestEvent>(resolve => {
      requestService.getNeedInfoObservable().subscribe((event: HttpRequestEvent) => {
        resolve(event);
      });
    });

    const httpRequestEvent: HttpRequestEvent = new HttpRequestEvent(null, null, 'schema-request');
    const requestHeader = new RequestHeader('a', 'b');
    requestService.setCustomHeaders([requestHeader]);
    requestService.getJsonSchema(httpRequestEvent);

    const jsonSchemaRequest = httpMock.expectOne('schema-request');
    const responseHeaders: HttpHeaders = new HttpHeaders({
      Link: '<https://chatty42.herokuapp.com/api/users>;rel="self",<https://chatty42.herokuapp.com/api/profile/users>;rel="profile"',
    });
    jsonSchemaRequest.flush(null, { headers: responseHeaders });
    expect(jsonSchemaRequest.request.method).toBe('HEAD');
    expect(jsonSchemaRequest.request.headers.get('a')).toBe('b');

    const jsonSchema: any = {
      title: 'User',
      properties: {
        fullName: {
          title: 'Full name',
          readOnly: false,
          type: 'string',
        },
        messages: {
          title: 'Messages',
          readOnly: true,
          type: 'string',
          format: 'uri',
        },
        id: {
          title: 'Id',
          readOnly: false,
          type: 'string',
        },
        email: {
          title: 'Email',
          readOnly: false,
          type: 'string',
        },
      },
      definitions: {},
      type: 'object',
      $schema: 'http://json-schema.org/draft-04/schema#',
    };

    const profileRequest = httpMock.expectOne('https://chatty42.herokuapp.com/api/profile/users');
    profileRequest.flush(jsonSchema);

    expect(profileRequest.request.method).toBe('GET');

    const event = await eventPromise;
    expect(event.jsonSchema).toBeDefined();
    expect(Object.prototype.hasOwnProperty.call(event.jsonSchema.properties, 'fullName')).toBeTruthy();
    expect(Object.prototype.hasOwnProperty.call(event.jsonSchema.properties, 'email')).toBeTruthy();
    expect(Object.prototype.hasOwnProperty.call(event.jsonSchema.properties, 'id')).toBeTruthy();
    expect(Object.prototype.hasOwnProperty.call(event.jsonSchema.properties, 'messages')).toBeFalsy();

    httpMock.verify();
  });

  it('should handle Link header without profile rel', async () => {
    const eventPromise = new Promise<HttpRequestEvent>(resolve => {
      requestService.getNeedInfoObservable().subscribe((event: HttpRequestEvent) => {
        resolve(event);
      });
    });

    const httpRequestEvent: HttpRequestEvent = new HttpRequestEvent(null, null, 'schema-request');
    requestService.getJsonSchema(httpRequestEvent);

    const jsonSchemaRequest = httpMock.expectOne('schema-request');
    const responseHeaders: HttpHeaders = new HttpHeaders({
      Link: '<https://chatty42.herokuapp.com/api/users>;rel="self",<https://chatty42.herokuapp.com/api/other>;rel="alternate"',
    });
    jsonSchemaRequest.flush(null, { headers: responseHeaders });
    expect(jsonSchemaRequest.request.method).toBe('HEAD');

    const event = await eventPromise;
    expect(event.jsonSchema).toBeUndefined();

    httpMock.verify();
  });

  it('should handle Link header with no rel part', async () => {
    const eventPromise = new Promise<HttpRequestEvent>(resolve => {
      requestService.getNeedInfoObservable().subscribe((event: HttpRequestEvent) => {
        resolve(event);
      });
    });

    const httpRequestEvent: HttpRequestEvent = new HttpRequestEvent(null, null, 'schema-request');
    requestService.getJsonSchema(httpRequestEvent);

    const jsonSchemaRequest = httpMock.expectOne('schema-request');
    const responseHeaders: HttpHeaders = new HttpHeaders({
      Link: '<https://chatty42.herokuapp.com/api/users>',
    });
    jsonSchemaRequest.flush(null, { headers: responseHeaders });
    expect(jsonSchemaRequest.request.method).toBe('HEAD');

    const event = await eventPromise;
    expect(event.jsonSchema).toBeUndefined();

    httpMock.verify();
  });

  it('should process json schema with no properties', async () => {
    const eventPromise = new Promise<HttpRequestEvent>(resolve => {
      requestService.getNeedInfoObservable().subscribe((event: HttpRequestEvent) => {
        resolve(event);
      });
    });

    const httpRequestEvent: HttpRequestEvent = new HttpRequestEvent(null, null, 'schema-request');
    requestService.getJsonSchema(httpRequestEvent);

    const jsonSchemaRequest = httpMock.expectOne('schema-request');
    const responseHeaders: HttpHeaders = new HttpHeaders({
      Link: '<https://chatty42.herokuapp.com/api/users>;rel="self",<https://chatty42.herokuapp.com/api/profile/users>;rel="profile"',
    });
    jsonSchemaRequest.flush(null, { headers: responseHeaders });

    const jsonSchema: any = {
      title: 'User',
      type: 'object',
      $schema: 'http://json-schema.org/draft-04/schema#',
    };

    const profileRequest = httpMock.expectOne('https://chatty42.herokuapp.com/api/profile/users');
    profileRequest.flush(jsonSchema);

    const event = await eventPromise;
    expect(event.jsonSchema).toEqual(jsonSchema);

    httpMock.verify();
  });

  it('should react on json schema error "HTTP get profile url"', async () => {
    const eventPromise = new Promise<HttpRequestEvent>(resolve => {
      requestService.getNeedInfoObservable().subscribe((event: HttpRequestEvent) => {
        resolve(event);
      });
    });

    const httpRequestEvent: HttpRequestEvent = new HttpRequestEvent(null, null, 'schema-request');
    requestService.getJsonSchema(httpRequestEvent);

    const jsonSchemaRequest = httpMock.expectOne('schema-request');
    const responseHeaders: HttpHeaders = new HttpHeaders({
      Link: '<https://chatty42.herokuapp.com/api/users>;rel="self",<https://chatty42.herokuapp.com/api/profile/users>;rel="profile"',
    });
    jsonSchemaRequest.flush(null, { headers: responseHeaders });
    expect(jsonSchemaRequest.request.method).toBe('HEAD');

    const profileRequest = httpMock.expectOne('https://chatty42.herokuapp.com/api/profile/users');
    const mockErrorResponse = {
      status: 404,
      statusText: 'Not Found',
    };

    vi.spyOn(window.console, 'warn');

    profileRequest.flush(null, mockErrorResponse);

    expect(window.console.warn).toHaveBeenCalled();
    expect(profileRequest.request.method).toBe('GET');

    const event = await eventPromise;
    expect(event.jsonSchema).toBeUndefined();

    httpMock.verify();
  });

  it('should react on json schema error "HTTP HEAD"', () => {
    const httpRequestEvent: HttpRequestEvent = new HttpRequestEvent(null, null, 'schema-request');
    requestService.getJsonSchema(httpRequestEvent);

    const jsonSchemaRequest = httpMock.expectOne('schema-request');
    const mockErrorResponse = {
      status: 404,
      statusText: 'Not Found',
    };

    vi.spyOn(window.console, 'warn');

    jsonSchemaRequest.flush(null, mockErrorResponse);

    expect(jsonSchemaRequest.request.method).toBe('HEAD');
    expect(window.console.warn).toHaveBeenCalled();

    httpMock.verify();
  });

  it('should fill json schema templated uri with empty parameters', () => {
    const httpRequestEvent: HttpRequestEvent = new HttpRequestEvent(null, null, 'http://schema.org{?filter}');

    requestService.getJsonSchema(httpRequestEvent);

    const profileRequest = httpMock.expectOne('http://schema.org');
    expect(profileRequest.request.method).toBe('HEAD');
  });

  it('should not request undefined uri', () => {
    vi.spyOn(requestService, 'processCommand');

    requestService.getUri(undefined);

    expect(requestService.processCommand).not.toHaveBeenCalled();
  });

  it('should not compute HAL-FORMS options from link', () => {
    vi.spyOn(httpClient, 'get');

    let property = {};
    requestService.computeHalFormsOptionsFromLink(property);
    property = { options: {} };
    requestService.computeHalFormsOptionsFromLink(property);
    property = { options: { link: {} } };
    requestService.computeHalFormsOptionsFromLink(property);

    expect(httpClient.get).not.toHaveBeenCalled();
  });

  it('should compute HAL-FORMS options from link', () => {
    vi.spyOn(httpClient, 'get');

    const property = { options: { link: { href: 'http://localhost/options' } } };
    requestService.computeHalFormsOptionsFromLink(property);
    const optionsRequest = httpMock.expectOne('http://localhost/options');
    optionsRequest.flush(['a', 'b']);

    expect(httpClient.get).toHaveBeenCalled();
    expect((property.options as any).inline).toEqual(['a', 'b']);
  });

  it('should use accept header from HAL-FORMS options from link.type', () => {
    vi.spyOn(httpClient, 'get');

    const property = {
      options: {
        link: {
          href: 'http://localhost/options',
          type: 'application/hal+json',
        },
      },
    };
    requestService.computeHalFormsOptionsFromLink(property);
    const optionsRequest = httpMock.expectOne('http://localhost/options');
    optionsRequest.flush(['a', 'b']);

    expect(httpClient.get).toHaveBeenCalled();
    expect((property.options as any).inline).toEqual(['a', 'b']);
    expect(optionsRequest.request.headers.get('Accept')).toBe('application/hal+json');
  });

  it('should fill HAL-FORMS options from link template with empty parameters', () => {
    vi.spyOn(httpClient, 'get');

    const property = {
      options: {
        link: {
          href: 'http://localhost/options{?value}',
          type: 'application/hal+json',
        },
      },
    };
    requestService.computeHalFormsOptionsFromLink(property);
    const optionsRequest = httpMock.expectOne('http://localhost/options');
    optionsRequest.flush(['a', 'b']);

    expect(httpClient.get).toHaveBeenCalled();
    expect((property.options as any).inline).toEqual(['a', 'b']);
    expect(optionsRequest.request.headers.get('Accept')).toBe('application/hal+json');
  });

  it('should fill HAL-FORMS options from link with HAL content', () => {
    vi.spyOn(httpClient, 'get');

    const property = {
      options: {
        link: {
          href: 'http://localhost/options',
          type: 'application/hal+json',
        },
      },
    };
    requestService.computeHalFormsOptionsFromLink(property);
    const optionsRequest = httpMock.expectOne('http://localhost/options');

    const responseHeaders: HttpHeaders = new HttpHeaders({
      'content-type': 'application/hal+json',
    });

    optionsRequest.flush({ _embedded: { xxx: ['a', 'b'] } }, { headers: responseHeaders });

    expect(httpClient.get).toHaveBeenCalled();
    expect((property.options as any).inline).toEqual(['a', 'b']);
    expect(optionsRequest.request.headers.get('Accept')).toBe('application/hal+json');
  });

  it('should fill HAL-FORMS options from link with HAL content', () => {
    vi.spyOn(httpClient, 'get');

    const property = {
      options: {
        link: {
          href: 'http://localhost/options',
          type: 'application/hal+json',
        },
      },
    };
    requestService.computeHalFormsOptionsFromLink(property);
    const optionsRequest = httpMock.expectOne('http://localhost/options');

    const responseHeaders: HttpHeaders = new HttpHeaders({
      'content-type': 'application/hal+json',
    });

    optionsRequest.flush({ _embedded: { xxx: ['a', 'b'] } }, { headers: responseHeaders });

    expect(httpClient.get).toHaveBeenCalled();
    expect((property.options as any).inline).toEqual(['a', 'b']);
    expect(optionsRequest.request.headers.get('Accept')).toBe('application/hal+json');
  });

  it('should fill HAL-FORMS options from link with HAL-FORMS content', () => {
    vi.spyOn(httpClient, 'get');

    const property = {
      options: {
        link: {
          href: 'http://localhost/options',
          type: 'application/prs.hal-forms+json',
        },
      },
    };
    requestService.computeHalFormsOptionsFromLink(property);
    const optionsRequest = httpMock.expectOne('http://localhost/options');

    const responseHeaders: HttpHeaders = new HttpHeaders({
      'content-type': 'application/prs.hal-forms+json',
    });

    optionsRequest.flush({ _embedded: { xxx: ['a', 'b'] } }, { headers: responseHeaders });

    expect(httpClient.get).toHaveBeenCalled();
    expect((property.options as any).inline).toEqual(['a', 'b']);
    expect(optionsRequest.request.headers.get('Accept')).toBe('application/prs.hal-forms+json');
  });

  it('should use HTTP OPTIONS request to discover link HTTP request options', () => {
    vi.spyOn(httpClient, 'options');

    const link: Link = new Link('self', 'http://localhost/options', 'title', 'name');
    requestService.getHttpOptions(link);
    const optionsRequest = httpMock.expectOne('http://localhost/options');

    const responseHeaders: HttpHeaders = new HttpHeaders({
      Allow: 'GET,HEAD,POST,OPTIONS',
    });

    optionsRequest.flush({}, { headers: responseHeaders });

    expect(httpClient.options).toHaveBeenCalled();
    expect(link.options).toBe('GET,HEAD,POST,OPTIONS');
  });

  it('should not use HTTP OPTIONS for URI template', () => {
    vi.spyOn(httpClient, 'options');

    const link: Link = new Link('self', 'http://localhost/options?{page}', 'title', 'name');
    requestService.getHttpOptions(link);

    expect(link.options).toBeUndefined();
  });

  it('should handle HTTP OPTIONS request error', () => {
    vi.spyOn(window.console, 'warn');

    const link: Link = new Link('self', 'http://localhost/options', 'title', 'name');
    requestService.getHttpOptions(link);

    const mockErrorResponse = {
      status: 404,
      statusText: 'Not Found',
    };
    httpMock.expectOne('http://localhost/options').flush('', mockErrorResponse);
    httpMock.verify();
    expect(window.console.warn).toHaveBeenCalled();
  });
});
