import {async, ComponentFixture, getTestBed, TestBed} from '@angular/core/testing';

import {ResponseExplorerComponent} from './response-explorer.component';
import {RequestService} from '../request/request.service';
import {HttpResponse} from '@angular/common/http';
import {JsonHighlighterService} from '../json-highlighter/json-highlighter.service';

class ObservableMock {
  private callback: Function;
  hasSubscribed = false;

  subscribe(next?: (value: HttpResponse<any>) => void, error?: (error: any) => void) {
    this.callback = next;
    this.hasSubscribed = true;
  }

  next(response: HttpResponse<any>) {
    this.callback(response);
  }
}

class RequestServiceMock {
  observableMock: ObservableMock = new ObservableMock();

  public getResponseObservable() {
    return this.observableMock;
  }
}

class JsonHighlighterServiceMock {
  syntaxHighlightInvoked = false;

  syntaxHighlight() {
    this.syntaxHighlightInvoked = true;
  }
}

describe('ResponseExplorerComponent', () => {
  let component: ResponseExplorerComponent;
  let fixture: ComponentFixture<ResponseExplorerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ResponseExplorerComponent],
      providers: [
        {provide: RequestService, useClass: RequestServiceMock},
        {provide: JsonHighlighterService, useClass: JsonHighlighterServiceMock}
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResponseExplorerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should subscribe to request service\'s response observable', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().get(RequestService);

    expect(requestServiceMock.observableMock.hasSubscribed).toBeTruthy();
  });

  it('should syntax highlight json', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().get(RequestService);
    const jsonHighlighterServiceMock: JsonHighlighterServiceMock = getTestBed().get(JsonHighlighterService);

    requestServiceMock.observableMock.next(new HttpResponse({body: {key: 'test'}}));

    expect(jsonHighlighterServiceMock.syntaxHighlightInvoked).toBeTruthy();
  });

  it('should not syntax highlight json when response body has no properties', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().get(RequestService);
    const jsonHighlighterServiceMock: JsonHighlighterServiceMock = getTestBed().get(JsonHighlighterService);

    requestServiceMock.observableMock.next(new HttpResponse({body: {}}));

    expect(jsonHighlighterServiceMock.syntaxHighlightInvoked).toBeFalsy();
  });

  it('should parse empty response body', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().get(RequestService);

    requestServiceMock.observableMock.next(new HttpResponse({body: {}}));

    expect(component.showProperties).toBeFalsy();
    expect(component.showLinks).toBeFalsy();
    expect(component.showEmbedded).toBeFalsy();
  });

  it('should parse HAL response body', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().get(RequestService);
    /* tslint:disable */
    const halResponse = {
      "text": "hello all!",
      "timeStamp": "2018-06-02T17:12:07.335Z",
      "_links": {
        "self": {
          "href": "https://chatty42.herokuapp.com/api/messages/1"
        },
        "chatty:chatMessage": {
          "href": "https://chatty42.herokuapp.com/api/messages/1{?projection}",
          "templated": true
        },
        "curies": [
          {
            "href": "https://chatty42.herokuapp.com/api/../docs/html5/{rel}.html",
            "name": "chatty",
            "templated": true
          }
        ]
      },
      "_embedded": {
        "chatty:author": {
          "name": "John"
        },
      }
    };
    /* tslint:enable */
    requestServiceMock.observableMock.next(new HttpResponse({body: halResponse}));

    expect(component.showProperties).toBeTruthy();
    expect(component.showLinks).toBeTruthy();
    expect(component.showEmbedded).toBeTruthy();
  });

});
