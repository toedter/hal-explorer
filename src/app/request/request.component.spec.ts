import {async, ComponentFixture, getTestBed, TestBed} from '@angular/core/testing';
import {RequestComponent} from './request.component';
import {FormsModule} from '@angular/forms';
import {Command, EventType, HttpRequestEvent, RequestService, UriTemplateEvent, UrlTemplateParameter} from './request.service';
import {AppService, RequestHeader} from '../app.service';
import {HttpClient} from '@angular/common/http';
import {JsonHighlighterService} from '../json-highlighter/json-highlighter.service';

class ObservableMock {
  private callback: Function;
  hasSubscribed = false;

  subscribe(next?: (value: any) => void, error?: (error: any) => void) {
    this.callback = next;
    this.hasSubscribed = true;
  }

  next(input: any) {
    this.callback(input);
  }
}

class AppServiceMock {
  _urlObservable: ObservableMock = new ObservableMock();
  _requestHeadersObservable: ObservableMock = new ObservableMock();

  getUrl(): string {
    return 'http://localhost/api';
  }

  getCustomRequestHeaders(): RequestHeader[] {
    return [];
  }

  setCustomRequestHeaders(requestHeaders: RequestHeader[]) {
  }

  get urlObservable(): ObservableMock {
    return this._urlObservable;
  }

  get requestHeadersObservable(): ObservableMock {
    return this._requestHeadersObservable;
  }

}

class RequestServiceMock {
  responseObservableMock: ObservableMock = new ObservableMock();
  needInfoObservableMock: ObservableMock = new ObservableMock();

  public getResponseObservable() {
    return this.responseObservableMock;
  }

  public getNeedInfoObservable() {
    return this.needInfoObservableMock;
  }

  public setCustomHeaders(requestHeaders: RequestHeader[]) {
  }

  public getUri(uri: string) {
  }
}

class JsonHighlighterServiceMock {
  syntaxHighlightInvoked = false;

  syntaxHighlight() {
    this.syntaxHighlightInvoked = true;
  }
}

describe('RequestComponent', () => {
  let component: RequestComponent;
  let fixture: ComponentFixture<RequestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [RequestComponent],
      providers: [
        {provide: RequestService, useClass: RequestServiceMock},
        {provide: AppService, useClass: AppServiceMock},
        {provide: JsonHighlighterService, useClass: JsonHighlighterServiceMock},
        HttpClient
      ]

    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fill uri template', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().get(RequestService);
    const uriTemplateParameters: UrlTemplateParameter[] = [];
    uriTemplateParameters.push(new UrlTemplateParameter('page', '0'));
    uriTemplateParameters.push(new UrlTemplateParameter('size', '10'));
    const event: UriTemplateEvent = new UriTemplateEvent(
      EventType.FillUriTemplate, 'http://localhost/api/things{page,size}', uriTemplateParameters);
    requestServiceMock.getNeedInfoObservable().next(event);
    expect(component.newRequestUrl).toBe('http://localhost/api/things?page=0&size=10');
  });

  it('should fill http request', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().get(RequestService);

    const event: HttpRequestEvent = new HttpRequestEvent(EventType.FillHttpRequest, Command.Post, 'http://localhost/api/things');
    requestServiceMock.getNeedInfoObservable().next(event);
    expect(component.newRequestUrl).toBe(undefined);
  });

});
