import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DocumentationComponent, getDocHeight } from './documentation.component';
import { RequestService } from '../request/request.service';
import { DomSanitizer } from '@angular/platform-browser';
import { Subject } from 'rxjs';

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

    const domSanitizerMock = jasmine.createSpyObj(['bypassSecurityTrustResourceUrl']);
    domSanitizerMock.bypassSecurityTrustResourceUrl.and.returnValue('/doc');

    TestBed.configureTestingModule({
      imports: [DocumentationComponent],
      providers: [
        {provide: RequestService, useValue: requestServiceMock},
        {provide: DomSanitizer, useValue: domSanitizerMock}
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

    expect(iFrame.style.height).toBe('14px');
  });

  it('should get iframe doc height', () => {
    const docHeight: number = getDocHeight(document);
    expect(docHeight).toBeGreaterThan(0);
  });

  it('should get iframe doc height with parameter "undefined"', () => {
    const docHeight: number = getDocHeight(undefined);
    expect(docHeight).toBeGreaterThan(0);
  });

  it('should get iframe doc height', () => {
    const iFrame = {style: {}, contentWindow: {document}};
    spyOn(document, 'getElementById').and.returnValue(iFrame as any);

    (window as any).setIframeHeight(1);

    const docHeight: number = getDocHeight(document);
    expect(docHeight).toBeGreaterThan(0);
  });

  it('should not get iframe doc height from cross origin', () => {
    const iFrame = {style: {}, contentDocument: {}};
    spyOn(document, 'getElementById').and.returnValue(iFrame as any);

    (window as any).setIframeHeight(1);

    expect((iFrame.style as any).height).not.toBe('10px');
  });
});


