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

  getUriCalledWith: string;

  public getResponseObservable() {
    return this.responseObservableMock;
  }

  public getNeedInfoObservable() {
    return this.needInfoObservableMock;
  }

  public setCustomHeaders(requestHeaders: RequestHeader[]) {
  }

  public getUri(uri: string) {
    this.getUriCalledWith = uri;
  }
}

class JsonHighlighterServiceMock {
  syntaxHighlightInvoked = false;

  syntaxHighlight() {
    this.syntaxHighlightInvoked = true;
  }
}

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
    expect(component.jsonSchema).toBe(undefined);
  });

  it('should fill http request with json schema', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().get(RequestService);

    const event: HttpRequestEvent =
      new HttpRequestEvent(EventType.FillHttpRequest, Command.Post, 'http://localhost/api/things', jsonSchema);
    requestServiceMock.getNeedInfoObservable().next(event);
    expect(component.jsonSchema.toString).toEqual(jsonSchema.toString);
  });

  it('should get expanded uri', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().get(RequestService);
    component.newRequestUrl = 'http://localhost';

    component.getExpandedUri();
    expect(requestServiceMock.getUriCalledWith).toBe('http://localhost');
  });

  it('should get change request body based on json schema', () => {
    component.jsonSchema = jsonSchema.properties;
    component.jsonSchema.email.value = 'kai@toedter.com';
    component.jsonSchema.fullName.value = 'Kai Toedter';

    component.requestBodyChanged();
    expect(component.requestBody).toBe('{\n  "fullName": "Kai Toedter",\n  "email": "kai@toedter.com"\n}');
  });

  it('should get tooltip with no json schema', () => {
    const tooltip = component.getTooltip('x');
    expect(tooltip).toBe('');
  });

  it('should get tooltip with json schema', () => {
    component.jsonSchema = jsonSchema.properties;
    const tooltip = component.getTooltip('email');
    expect(tooltip).toBe('string');
  });

  it('should get tooltip with json schema with format attribute', () => {
    component.jsonSchema = jsonSchema.properties;
    const tooltip = component.getTooltip('messages');
    expect(tooltip).toBe('string in uri format');
  });

  it('should go from hash change', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().get(RequestService);
    component.newRequestUrl = 'http://localhost';

    component.goFromHashChange('http://localhost');
    expect(requestServiceMock.getUriCalledWith).toBe('http://localhost');
  });

});
