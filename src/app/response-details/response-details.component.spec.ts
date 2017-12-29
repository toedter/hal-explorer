import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResponseBodyComponent } from './response-details.component';
import {RequestService} from '../request/request.service';
import {HttpClient, HttpHandler} from '@angular/common/http';
import {AppService} from '../app.service';
import {JsonHighlighterService} from '../json-highlighter/json-highlighter.service';

describe('ResponseDetailsComponent', () => {
  let component: ResponseBodyComponent;
  let fixture: ComponentFixture<ResponseBodyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResponseBodyComponent ],
      providers: [RequestService, AppService, JsonHighlighterService, HttpClient, HttpHandler]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResponseBodyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
