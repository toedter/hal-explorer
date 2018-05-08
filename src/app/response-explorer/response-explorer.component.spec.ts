import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {ResponseExplorerComponent} from './response-explorer.component';
import {RequestService} from '../request/request.service';
import {HttpResponse} from '@angular/common/http';
import {JsonHighlighterService} from '../json-highlighter/json-highlighter.service';

class ObservableMock {
  subscribe(next?: (value: HttpResponse<any>) => void, error?: (error: any) => void) {
    // console.log('subscribed');
    next(new HttpResponse<any>());
  }
}

class RequestServiceMock {
  getResponseObservable() {
    return new ObservableMock();
  }
}

class JsonHighlighterServiceMock {
  syntaxHighlight() {
    // console.log('syntaxHighlight invoked');
  }
}

describe('ResponseExplorerComponent', () => {
  let component: ResponseExplorerComponent;
  let fixture: ComponentFixture<ResponseExplorerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResponseExplorerComponent ],
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
});
