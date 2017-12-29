import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RequestComponent } from './request.component';
import { FormsModule } from '@angular/forms';
import {RequestService} from './request.service';
import {HttpClient, HttpHandler} from '@angular/common/http';
import {AppService} from '../app.service';
import {JsonHighlighterService} from '../json-highlighter/json-highlighter.service';

describe('RequestComponent', () => {
  let component: RequestComponent;
  let fixture: ComponentFixture<RequestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ FormsModule ],
      declarations: [ RequestComponent ],
      providers: [RequestService, AppService, JsonHighlighterService, HttpClient, HttpHandler]
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
});
