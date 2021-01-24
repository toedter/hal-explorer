import {ComponentFixture, getTestBed, TestBed, waitForAsync} from '@angular/core/testing';

import {DocumentationComponent, getDocHeight} from './documentation.component';
import {RequestService} from '../request/request.service';
import {DomSanitizer} from '@angular/platform-browser';
import {Observable, Subject} from 'rxjs';

class ObservableMock {
  private callback: (value: any) => void;
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

  getResponseObservable() {
    return this.responseObservableMock;
  }

  getDocumentationObservable() {
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
  let documentationSubject;
  let responseSubject;

  beforeEach(waitForAsync(() => {
    const requestServiceMock = jasmine.createSpyObj(['getResponseObservable', 'getDocumentationObservable']);
    documentationSubject = new Subject<string>();
    responseSubject = new Subject<string>();
    requestServiceMock.getDocumentationObservable.and.returnValue(documentationSubject);
    requestServiceMock.getResponseObservable.and.returnValue(responseSubject);

    TestBed.configureTestingModule({
      declarations: [DocumentationComponent],
      providers: [
        {provide: RequestService, useValue: requestServiceMock},
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
    documentationSubject.next('/doc');

    expect(component.docUri).toEqual('/doc');
  });

  it('should log error on document observable error', () => {
    spyOn(window.console, 'error');
    documentationSubject.error('my error');

    expect(window.console.error).toHaveBeenCalled();
  });

  it('should unset doc uri on response arrival', () => {
    documentationSubject.next('/doc');
    responseSubject.next('response');

    expect(component.docUri).toBeUndefined();
  });

  it('should set iFrame height', () => {
    const iFrame = document.createElement('iframe');
    const html = '<body>Foo</body>';
    iFrame.src = 'data:text/html;charset=utf-8,' + encodeURI(html);
    iFrame.id = 'doc-iframe';
    document.body.appendChild(iFrame);

    (window as any).setIframeHeight(iFrame.id);

    expect(iFrame.style.height).toBe('12px');
  });

  it('should get iframe doc height', () => {
    const docHeight: number = getDocHeight(document);
    expect(docHeight).toBeGreaterThan(0);
  });

  it('should get iframe doc height with parameter "undefined"', () => {
    const docHeight: number = getDocHeight(undefined);
    expect(docHeight).toBeGreaterThan(0);
  });

});


