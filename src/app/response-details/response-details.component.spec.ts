import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';

import {ResponseDetailsComponent} from './response-details.component';
import {RequestService, Response} from '../request/request.service';
import {JsonHighlighterService} from '../json-highlighter/json-highlighter.service';
import { HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import {Subject} from 'rxjs';

describe('ResponseDetailsComponent', () => {
  let component: ResponseDetailsComponent;
  let fixture: ComponentFixture<ResponseDetailsComponent>;
  let responseSubject;

  beforeEach(waitForAsync(() => {
    const requestServiceMock = jasmine.createSpyObj(['getResponseObservable']);
    responseSubject = new Subject<Response>();
    requestServiceMock.getResponseObservable.and.returnValue(responseSubject);

    const jsonHighlighterServiceMock = jasmine.createSpyObj(['syntaxHighlight']);

    TestBed.configureTestingModule({
    imports: [ResponseDetailsComponent],
    providers: [
        { provide: RequestService, useValue: requestServiceMock },
        { provide: JsonHighlighterService, useValue: jsonHighlighterServiceMock }
    ]
}).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResponseDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should handle json HTTP response', () => {
    responseSubject.next(new Response(new HttpResponse({body: {key: 'test'}}), null));

    expect(component.httpResponse.status).toBe(200);
    expect(component.isString).toBeFalsy();
  });

  it('should handle string HTTP response', () => {
    responseSubject.next((new Response(new HttpResponse({body: 'string'}), null)));

    expect(component.httpResponse.status).toBe(200);
    expect(component.isString).toBeTruthy();
  });

  it('should handle HTTP response headers', () => {
    const responseHeaders: HttpHeaders = new HttpHeaders(
      {
        key: 'value'
      });
    responseSubject.next(new Response(new HttpResponse({headers: responseHeaders}), null));

    expect(component.httpResponse.status).toBe(200);
    expect(component.httpResponse.headers.keys().length).toBe(1);
  });

  it('should handle HTTP response status 0', () => {
    responseSubject.next(new Response(new HttpResponse({status: 0, statusText: 'unknown'}), null));

    expect(component.httpResponse.status).toBe(0);
    expect(component.httpResponse.statusText).toBe('unknown');
  });

  it('should handle HTTP response error (as string)', () => {
    spyOn(window.console, 'error');

    responseSubject.next(new Response(null,
      new HttpErrorResponse({status: 404, statusText: 'Not Found', error: 'error string'})));

    expect(window.console.error).not.toHaveBeenCalled();
  });

  it('should handle HTTP response error (as object)', () => {
    spyOn(window.console, 'error');

    responseSubject.next(new Response(null,
      new HttpErrorResponse({status: 404, statusText: 'Not Found', error: {error: 0}})));

    expect(window.console.error).not.toHaveBeenCalled();
  });

  it('should handle HTTP response subject error', () => {
    spyOn(window.console, 'error');

    responseSubject.error(new Response(null, new HttpErrorResponse({status: 404, statusText: 'Not Found'})));

    expect(window.console.error).toHaveBeenCalled();
  });

  it('should handle HTTP response subject error with status 0', () => {
    spyOn(window.console, 'error');

    responseSubject.next(new Response(null, new HttpErrorResponse({status: 0, statusText: 'Unknown status'})));

    expect(window.console.error).not.toHaveBeenCalled();
    expect(component.httpErrorResponse.status).toBe(0);
    expect(component.httpErrorResponse.statusText).toBe('Unknown status');
  });
});
