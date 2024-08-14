import {TestBed} from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {Command, HttpRequestEvent, RequestService, Response} from './request.service';
import {AppService, RequestHeader} from '../app.service';
import { HttpClient, HttpHeaders, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {Type} from '@angular/core';
import {Link} from '../response-explorer/response-explorer.component';

describe('RequestService', () => {
  let requestService: RequestService;
  let appService: AppService;
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [RequestService, AppService, HttpClient, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    requestService = TestBed.inject(RequestService);
    appService = TestBed.inject(AppService);
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

  it('should set default accept request header', (done) => {
    requestService.getResponseObservable().subscribe((response: Response) => {
      expect(response.httpResponse.body).toBe('body');
      done();
    });

    requestService.getUri('test-request');

    const testRequest = httpMock.expectOne('test-request');
    testRequest.flush('body');

    expect(testRequest.request.headers.keys()).toContain('Accept');

    httpMock.verify();
  });

  it('should not set default accept request header when custom accept header exists', (done) => {
    requestService.getResponseObservable().subscribe((response: Response) => {
      expect(response.httpResponse.body).toBe('body');
      done();
    });

    const customAcceptHeader = new RequestHeader('Accept', 'foo/bar');

    requestService.setCustomHeaders([customAcceptHeader]);
    requestService.getUri('test-request');

    const testRequest = httpMock.expectOne('test-request');
    testRequest.flush('body');

    expect(testRequest.request.headers.keys()).toContain('Accept');
    expect(testRequest.request.headers.keys().length).toBe(1);
    expect(testRequest.request.headers.get('Accept')).toBe('foo/bar');
    httpMock.verify();
  });

  it('should set Content-Type request header for POST request with default content type', (done) => {
    requestService.getResponseObservable().subscribe((response: Response) => {
      expect(response.httpResponse.body).toBe('body');
      done();
    });

    requestService.requestUri('test-request', 'POST', 'body');

    const testRequest = httpMock.expectOne('test-request');
    testRequest.flush('body');

    expect(testRequest.request.headers.keys()).toContain('Content-Type');
    expect(testRequest.request.headers.get('Content-Type')).toBe('application/json; charset=utf-8');

    httpMock.verify();
  });

  it('should set Content-Type request header for POST request with specified content type', (done) => {
    requestService.getResponseObservable().subscribe((response: Response) => {
      expect(response.httpResponse.body).toBe('body');
      done();
    });

    requestService.requestUri('test-request', 'POST', 'body', 'myContentType');

    const testRequest = httpMock.expectOne('test-request');
    testRequest.flush('body');

    expect(testRequest.request.headers.keys()).toContain('Content-Type');
    expect(testRequest.request.headers.get('Content-Type')).toBe('myContentType');

    httpMock.verify();
  });

  it('should process Get command', (done) => {
    requestService.getResponseObservable().subscribe((response: Response) => {
      expect(response.httpResponse.body).toBe('body');
      done();
    });

    requestService.processCommand(Command.Get, 'test-request');

    const testRequest = httpMock.expectOne('test-request');
    testRequest.flush('body');

    expect(testRequest.request.method).toBe('GET');

    httpMock.verify();
  });


  it('should process Post command', (done) => {
    requestService.getNeedInfoObservable().subscribe((event: HttpRequestEvent) => {
      expect(event.jsonSchema).toBeUndefined();
      done();
    });

    requestService.processCommand(Command.Post, 'test-request');

    const testRequest = httpMock.expectOne('test-request');
    testRequest.flush('body');

    // first do a head request to figure out if there are available profiles
    expect(testRequest.request.method).toBe('HEAD');

    httpMock.verify();
  });

  it('should handle HTTP request error', (done) => {
    const body = 'Invalid request parameters';
    requestService.getResponseObservable().subscribe((response: Response) => {
      expect(response.httpErrorResponse.status).toBe(404);
      expect(response.httpErrorResponse.statusText).toBe('Not Found');
      done();
    });

    requestService.processCommand(Command.Get, 'test-request');

    const mockErrorResponse = {
      status: 404, statusText: 'Not Found'
    };
    httpMock.expectOne('test-request').flush(body, mockErrorResponse);

    httpMock.verify();
  });

  it('should handle HTTP request error with ErrorEvent', () => {
    spyOn(window.console, 'error');
    const errorEvent: ErrorEvent = new ErrorEvent('MyError');
    requestService.processCommand(Command.Get, 'test-request');

    const mockErrorResponse = {
      status: 404, statusText: 'Not Found'
    };
    httpMock.expectOne('test-request').flush(errorEvent, mockErrorResponse);
    expect(window.console.error).not.toHaveBeenCalled();
  });

  it('should handle templated URIs', (done) => {
    requestService.getNeedInfoObservable().subscribe((event: any) => {
      const httpRequestEvent: HttpRequestEvent = event as HttpRequestEvent;
      expect(httpRequestEvent.uri).toBe('http://localhost{?page}');
      done();
    });

    requestService.processCommand(Command.Get, 'http://localhost{?page}');
  });

  it('should process document command', (done) => {
    requestService.getDocumentationObservable().subscribe((docUrl: string) => {
      expect(docUrl).toBe('http://doc');
      done();
    });
    requestService.processCommand(Command.Document, 'http://doc');
  });

  it('should process delete command', (done) => {
    requestService.getResponseObservable().subscribe((response: Response) => {
      expect(response.httpResponse.status).toBe(204);
      done();
    });

    requestService.processCommand(Command.Delete, 'test-request{template}');

    const testRequest = httpMock.expectOne('test-request');
    testRequest.flush(null, {status: 204, statusText: 'No Content'});

    expect(testRequest.request.method).toBe('DELETE');

    httpMock.verify();
  });

  it('should process json schema', (done) => {
    requestService.getNeedInfoObservable().subscribe((event: HttpRequestEvent) => {
      expect(event.jsonSchema).toBeDefined();
      expect(event.jsonSchema.properties.hasOwnProperty('fullName')).toBeTruthy();
      expect(event.jsonSchema.properties.hasOwnProperty('email')).toBeTruthy();
      expect(event.jsonSchema.properties.hasOwnProperty('id')).toBeTruthy();
      expect(event.jsonSchema.properties.hasOwnProperty('messages')).toBeFalsy();
      done();
    });

    const httpRequestEvent: HttpRequestEvent = new HttpRequestEvent(null, null, 'schema-request');
    const requestHeader = new RequestHeader('a', 'b');
    requestService.setCustomHeaders([requestHeader]);
    requestService.getJsonSchema(httpRequestEvent);

    const jsonSchemaRequest = httpMock.expectOne('schema-request');
    const responseHeaders: HttpHeaders = new HttpHeaders(
      {
        Link: '<https://chatty42.herokuapp.com/api/users>;rel="self",<https://chatty42.herokuapp.com/api/profile/users>;rel="profile"'
      });
    jsonSchemaRequest.flush(null, {headers: responseHeaders});
    expect(jsonSchemaRequest.request.method).toBe('HEAD');
    expect(jsonSchemaRequest.request.headers.get('a')).toBe('b');

    /* eslint-disable */
    const jsonSchema: any = {
      'title': 'User',
      'properties': {
        'fullName': {
          'title': 'Full name',
          'readOnly': false,
          'type': 'string'
        },
        'messages': {
          'title': 'Messages',
          'readOnly': true,
          'type': 'string',
          'format': 'uri'
        },
        'id': {
          'title': 'Id',
          'readOnly': false,
          'type': 'string'
        },
        'email': {
          'title': 'Email',
          'readOnly': false,
          'type': 'string'
        }
      },
      'definitions': {},
      'type': 'object',
      '$schema': 'http://json-schema.org/draft-04/schema#'
    };
    /* eslint-enable */

    const profileRequest = httpMock.expectOne('https://chatty42.herokuapp.com/api/profile/users');
    profileRequest.flush(jsonSchema);

    expect(profileRequest.request.method).toBe('GET');

    httpMock.verify();
  });

  it('should react on json schema error "HTTP get profile url"', (done) => {
    requestService.getNeedInfoObservable().subscribe((event: HttpRequestEvent) => {
      expect(event.jsonSchema).toBeUndefined();
      done();
    });

    const httpRequestEvent: HttpRequestEvent = new HttpRequestEvent(null, null, 'schema-request');
    requestService.getJsonSchema(httpRequestEvent);

    const jsonSchemaRequest = httpMock.expectOne('schema-request');
    const responseHeaders: HttpHeaders = new HttpHeaders(
      {
        Link: '<https://chatty42.herokuapp.com/api/users>;rel="self",<https://chatty42.herokuapp.com/api/profile/users>;rel="profile"'
      });
    jsonSchemaRequest.flush(null, {headers: responseHeaders});
    expect(jsonSchemaRequest.request.method).toBe('HEAD');

    const profileRequest = httpMock.expectOne('https://chatty42.herokuapp.com/api/profile/users');
    const mockErrorResponse = {
      status: 404, statusText: 'Not Found'
    };

    spyOn(window.console, 'warn');

    profileRequest.flush(null, mockErrorResponse);

    expect(window.console.warn).toHaveBeenCalled();
    expect(profileRequest.request.method).toBe('GET');

    httpMock.verify();
  });

  it('should react on json schema error "HTTP HEAD"', () => {
    const httpRequestEvent: HttpRequestEvent = new HttpRequestEvent(null, null, 'schema-request');
    requestService.getJsonSchema(httpRequestEvent);

    const jsonSchemaRequest = httpMock.expectOne('schema-request');
    const mockErrorResponse = {
      status: 404, statusText: 'Not Found'
    };

    spyOn(window.console, 'warn');

    jsonSchemaRequest.flush(null, mockErrorResponse);

    expect(jsonSchemaRequest.request.method).toBe('HEAD');
    expect(window.console.warn).toHaveBeenCalled();

    httpMock.verify();
  });

  it('should fill json schema templated uri with empty parameters', () => {
    const httpRequestEvent: HttpRequestEvent =
      new HttpRequestEvent(null, null, 'http://schema.org{?filter}');

    requestService.getJsonSchema(httpRequestEvent);

    const profileRequest = httpMock.expectOne('http://schema.org');
    expect(profileRequest.request.method).toBe('HEAD');
  });

  it('should not request undefined uri', () => {
    spyOn(requestService, 'processCommand').and.callThrough();

    requestService.getUri(undefined);

    expect(requestService.processCommand).not.toHaveBeenCalled();
  });

  it('should not compute HAL-FORMS options from link', () => {
    spyOn(httpClient, 'get').and.callThrough();

    let property = {};
    requestService.computeHalFormsOptionsFromLink(property);
    property = {options: {}};
    requestService.computeHalFormsOptionsFromLink(property);
    property = {options: {link: {}}};
    requestService.computeHalFormsOptionsFromLink(property);

    expect(httpClient.get).not.toHaveBeenCalled();
  });

  it('should compute HAL-FORMS options from link', () => {
    spyOn(httpClient, 'get').and.callThrough();

    const property = {options: {link: {href: 'http://localhost/options'}}};
    requestService.computeHalFormsOptionsFromLink(property);
    const optionsRequest = httpMock.expectOne('http://localhost/options');
    optionsRequest.flush(['a', 'b']);

    expect(httpClient.get).toHaveBeenCalled();
    expect((property.options as any).inline).toEqual(['a', 'b']);
  });

  it('should use accept header from HAL-FORMS options from link.type', () => {
    spyOn(httpClient, 'get').and.callThrough();

    const property = {
      options: {
        link: {
          href: 'http://localhost/options',
          type: 'application/hal+json'
        }
      }
    };
    requestService.computeHalFormsOptionsFromLink(property);
    const optionsRequest = httpMock.expectOne('http://localhost/options');
    optionsRequest.flush(['a', 'b']);

    expect(httpClient.get).toHaveBeenCalled();
    expect((property.options as any).inline).toEqual(['a', 'b']);
    expect(optionsRequest.request.headers.get('Accept')).toBe('application/hal+json');
  });

  it('should fill HAL-FORMS options from link template with empty parameters', () => {
    spyOn(httpClient, 'get').and.callThrough();

    const property = {
      options: {
        link: {
          href: 'http://localhost/options{?value}',
          type: 'application/hal+json'
        }
      }
    };
    requestService.computeHalFormsOptionsFromLink(property);
    const optionsRequest = httpMock.expectOne('http://localhost/options');
    optionsRequest.flush(['a', 'b']);

    expect(httpClient.get).toHaveBeenCalled();
    expect((property.options as any).inline).toEqual(['a', 'b']);
    expect(optionsRequest.request.headers.get('Accept')).toBe('application/hal+json');
  });


  it('should fill HAL-FORMS options from link with HAL content', () => {
    spyOn(httpClient, 'get').and.callThrough();

    const property = {
      options: {
        link: {
          href: 'http://localhost/options',
          type: 'application/hal+json'
        }
      }
    };
    requestService.computeHalFormsOptionsFromLink(property);
    const optionsRequest = httpMock.expectOne('http://localhost/options');

    const responseHeaders: HttpHeaders = new HttpHeaders(
      {
        'content-type': 'application/hal+json'
      });

    optionsRequest.flush({_embedded: {xxx: ['a', 'b']}}, {headers: responseHeaders});

    expect(httpClient.get).toHaveBeenCalled();
    expect((property.options as any).inline).toEqual(['a', 'b']);
    expect(optionsRequest.request.headers.get('Accept')).toBe('application/hal+json');
  });

  it('should fill HAL-FORMS options from link with HAL content', () => {
    spyOn(httpClient, 'get').and.callThrough();

    const property = {
      options: {
        link: {
          href: 'http://localhost/options',
          type: 'application/hal+json'
        }
      }
    };
    requestService.computeHalFormsOptionsFromLink(property);
    const optionsRequest = httpMock.expectOne('http://localhost/options');

    const responseHeaders: HttpHeaders = new HttpHeaders(
      {
        'content-type': 'application/hal+json'
      });

    optionsRequest.flush({_embedded: {xxx: ['a', 'b']}}, {headers: responseHeaders});

    expect(httpClient.get).toHaveBeenCalled();
    expect((property.options as any).inline).toEqual(['a', 'b']);
    expect(optionsRequest.request.headers.get('Accept')).toBe('application/hal+json');
  });

  it('should fill HAL-FORMS options from link with HAL-FORMS content', () => {
    spyOn(httpClient, 'get').and.callThrough();

    const property = {
      options: {
        link: {
          href: 'http://localhost/options',
          type: 'application/prs.hal-forms+json'
        }
      }
    };
    requestService.computeHalFormsOptionsFromLink(property);
    const optionsRequest = httpMock.expectOne('http://localhost/options');

    const responseHeaders: HttpHeaders = new HttpHeaders(
      {
        'content-type': 'application/prs.hal-forms+json'
      });

    optionsRequest.flush({_embedded: {xxx: ['a', 'b']}}, {headers: responseHeaders});

    expect(httpClient.get).toHaveBeenCalled();
    expect((property.options as any).inline).toEqual(['a', 'b']);
    expect(optionsRequest.request.headers.get('Accept')).toBe('application/prs.hal-forms+json');
  });

  it('should use HTTP OPTIONS request to discover link HTTP request options', () => {
    spyOn(httpClient, 'options').and.callThrough();

    const link: Link = new Link('self', 'http://localhost/options', 'title', 'name');
    requestService.getHttpOptions(link);
    const optionsRequest = httpMock.expectOne('http://localhost/options');

    const responseHeaders: HttpHeaders = new HttpHeaders(
      {
        'Allow': 'GET,HEAD,POST,OPTIONS'
      });

    optionsRequest.flush({}, {headers: responseHeaders});

    expect(httpClient.options).toHaveBeenCalled();
    expect(link.options).toBe('GET,HEAD,POST,OPTIONS');
  });

  it('should not use HTTP OPTIONS for URI template', () => {
    spyOn(httpClient, 'options').and.callThrough();

    const link: Link = new Link('self', 'http://localhost/options?{page}', 'title', 'name');
    requestService.getHttpOptions(link);

    expect(link.options).toBeUndefined();
  });

  it('should handle HTTP OPTIONS request error', () => {
    spyOn(window.console, 'warn');

    const link: Link = new Link('self', 'http://localhost/options', 'title', 'name');
    requestService.getHttpOptions(link);

    const mockErrorResponse = {
      status: 404, statusText: 'Not Found'
    };
    httpMock.expectOne('http://localhost/options').flush('', mockErrorResponse);
    httpMock.verify();
    expect(window.console.warn).toHaveBeenCalled();
  });

});
