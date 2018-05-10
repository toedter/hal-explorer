import {async, ComponentFixture, getTestBed, TestBed} from '@angular/core/testing';

import {DocumentationComponent} from './documentation.component';
import {RequestService} from '../request/request.service';
import {DomSanitizer} from '@angular/platform-browser';

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

class RequestServiceMock {
  responseObservableMock: ObservableMock = new ObservableMock();
  documentationObservableMock: ObservableMock = new ObservableMock();

  public getResponseObservable() {
    return this.responseObservableMock;
  }

  public getDocumentationObservable() {
    return this.documentationObservableMock;
  }
}

class DomSanitizerMock {
  bypassSecurityTrustResourceUrl(docUri) {
    return docUri;
  }
}

describe('DocumentationComponent', () => {
  let component: DocumentationComponent;
  let fixture: ComponentFixture<DocumentationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DocumentationComponent],
      providers: [
        {provide: RequestService, useClass: RequestServiceMock},
        {provide: DomSanitizer, useClass: DomSanitizerMock}
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

  it('should set doc uri', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().get(RequestService);

    requestServiceMock.documentationObservableMock.next('/doc');

    expect(component.docUri).toEqual('/doc');
  });

  it('should unset doc uri on response arrival', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().get(RequestService);

    requestServiceMock.documentationObservableMock.next('/doc');
    requestServiceMock.responseObservableMock.next('response');

    expect(component.docUri).toBeUndefined();
  });
});


