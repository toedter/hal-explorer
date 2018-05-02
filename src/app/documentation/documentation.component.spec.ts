import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {DocumentationComponent} from './documentation.component';
import {RequestService} from '../request/request.service';
import {DomSanitizer} from '@angular/platform-browser';
import {AppService} from '../app.service';
import {HttpClient} from '@angular/common/http';

class AppServiceMock {}
class HttpClientMock {}

describe('DocumentationComponent', () => {
  let component: DocumentationComponent;
  let fixture: ComponentFixture<DocumentationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DocumentationComponent ],
      providers: [
        {provide: RequestService, useClass: RequestService},
        {provide: AppService, useClass: AppServiceMock},
        {provide: HttpClient, useClass: HttpClientMock},
        {provide: DomSanitizer, useClass: DomSanitizer}
      ]

    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});


