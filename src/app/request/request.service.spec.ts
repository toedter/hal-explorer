import {TestBed} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {Command, HttpRequestEvent, RequestService, UriTemplateEvent} from './request.service';
import {AppService, RequestHeader} from '../app.service';
import {HttpClient, HttpHeaders, HttpResponse} from '@angular/common/http';

describe('RequestService', () => {
  let requestService: RequestService;
  let appService: AppService;
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RequestService, AppService, HttpClient]
    });
    requestService = TestBed.get(RequestService);
    appService = TestBed.get(AppService);
    httpMock = TestBed.get(HttpTestingController);
    httpClient = TestBed.get(HttpClient);
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
    requestService.getResponseObservable().subscribe((response: HttpResponse<any>) => {
      expect(response.body).toBe('body');
      done();
    });

    requestService.getUri('test-request');

    const testRequest = httpMock.expectOne('test-request');
    testRequest.flush('body');

    expect(testRequest.request.headers.keys()).toContain('Accept');

    httpMock.verify();
  });

  it('should not set default accept request header when custom accept header exists', (done) => {
    requestService.getResponseObservable().subscribe((response: HttpResponse<any>) => {
      expect(response.body).toBe('body');
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

  it('should set Content-Type request header for POST request', (done) => {
    requestService.getResponseObservable().subscribe((response: HttpResponse<any>) => {
      expect(response.body).toBe('body');
      done();
    });

    requestService.requestUri('test-request', 'POST', 'body');

    const testRequest = httpMock.expectOne('test-request');
    testRequest.flush('body');

    expect(testRequest.request.headers.keys()).toContain('Content-Type');
    expect(testRequest.request.headers.get('Content-Type')).toBe('application/json; charset=utf-8');

    httpMock.verify();
  });

  it('should process Get command', (done) => {
    requestService.getResponseObservable().subscribe((response: HttpResponse<any>) => {
      expect(response.body).toBe('body');
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

  it('should handle error', (done) => {
    requestService.getResponseObservable().subscribe((response: HttpResponse<any>) => {
      expect(response.body).toBe('Invalid request parameters');
      done();
    });

    requestService.processCommand(Command.Get, 'test-request');

    const mockErrorResponse = {
      status: 404, statusText: 'Bad Request'
    };
    const data = 'Invalid request parameters';
    httpMock.expectOne('test-request').flush(data, mockErrorResponse);

    httpMock.verify();
  });

  it('should handle templated URLs', (done) => {
    requestService.getNeedInfoObservable().subscribe((event: any) => {
      const templateEvent: UriTemplateEvent = <UriTemplateEvent>event;
      expect(templateEvent.templatedUrl).toBe('http://localhost{page}');
      expect(templateEvent.parameters[0].key).toBe('page');
      done();
    });
    requestService.processCommand(Command.Get, 'http://localhost{page}');
  });

  it('should process document command', (done) => {
    requestService.getDocumentationObservable().subscribe((docUrl: string) => {
      expect(docUrl).toBe('http://doc');
      done();
    });
    requestService.processCommand(Command.Document, 'http://doc');
  });

  it('should process delete command', (done) => {
    requestService.getResponseObservable().subscribe((response: HttpResponse<any>) => {
      expect(response.status).toBe(204);
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
    requestService.getJsonSchema(httpRequestEvent);

    const jsonSchemaRequest = httpMock.expectOne('schema-request');
    const responseHeaders: HttpHeaders = new HttpHeaders(
      {
        'Link': '<https://chatty42.herokuapp.com/api/users>;rel="self",<https://chatty42.herokuapp.com/api/profile/users>;rel="profile"'
      });
    jsonSchemaRequest.flush(null, {headers: responseHeaders});
    expect(jsonSchemaRequest.request.method).toBe('HEAD');

    /* tslint:disable */
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
    /* tslint:enable */

    const profileRequest = httpMock.expectOne('https://chatty42.herokuapp.com/api/profile/users');
    profileRequest.flush(jsonSchema);

    expect(profileRequest.request.method).toBe('GET');

    httpMock.verify();
  });

});
