import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResponseDetailsComponent } from './response-details.component';
import {RequestService} from '../request/request.service';
import {HttpClient, HttpHandler} from '@angular/common/http';
import {AppService} from '../app.service';
import {JsonHighlighterService} from '../json-highlighter/json-highlighter.service';

describe('ResponseDetailsComponent', () => {
  let component: ResponseDetailsComponent;
  let fixture: ComponentFixture<ResponseDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResponseDetailsComponent ],
      providers: [RequestService, AppService, JsonHighlighterService, HttpClient, HttpHandler]
    })
    .compileComponents();
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
