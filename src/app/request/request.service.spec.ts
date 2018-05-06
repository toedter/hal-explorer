import {TestBed} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {RequestService} from './request.service';
import {AppService} from '../app.service';
import {HttpClient, HttpResponse} from '@angular/common/http';

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

  it('should set standard request headers', (done) => {
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

});
