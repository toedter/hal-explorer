import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResponseExplorerComponent } from './response-explorer.component';
import {RequestService} from '../request/request.service';
import {HttpClient, HttpHandler} from '@angular/common/http';
import {AppService} from '../app.service';
import {JsonHighlighterService} from '../json-highlighter/json-highlighter.service';

describe('ResponseExplorerComponent', () => {
  let component: ResponseExplorerComponent;
  let fixture: ComponentFixture<ResponseExplorerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResponseExplorerComponent ],
      providers: [RequestService, AppService, HttpClient, HttpHandler, JsonHighlighterService]
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
