///<reference path="../../../node_modules/rxjs/internal/Observable.d.ts"/>
import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {ResponseDetailsComponent} from './response-details.component';
import {RequestService} from '../request/request.service';
import {JsonHighlighterService} from '../json-highlighter/json-highlighter.service';
import {HttpResponse} from '@angular/common/http';

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

describe('ResponseDetailsComponent', () => {
  let component: ResponseDetailsComponent;
  let fixture: ComponentFixture<ResponseDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ResponseDetailsComponent],
      providers: [
        {provide: RequestService, useClass: RequestServiceMock},
        {provide: JsonHighlighterService, useClass: JsonHighlighterServiceMock}
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
});
