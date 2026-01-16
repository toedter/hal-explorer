import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentationComponent } from './documentation.component';
import { RequestService } from '../request/request.service';
import { DomSanitizer } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('DocumentationComponent', () => {
  let component: DocumentationComponent;
  let fixture: ComponentFixture<DocumentationComponent>;
  let documentationSubject;
  let responseSubject;

  beforeEach(async () => {
    const requestServiceMock = {
      getResponseObservable: vi.fn(),
      getDocumentationObservable: vi.fn(),
    };
    documentationSubject = new Subject<string>();
    responseSubject = new Subject<string>();
    requestServiceMock.getDocumentationObservable.mockReturnValue(documentationSubject);
    requestServiceMock.getResponseObservable.mockReturnValue(responseSubject);

    const domSanitizerMock = {
      bypassSecurityTrustResourceUrl: vi.fn(),
    };
    domSanitizerMock.bypassSecurityTrustResourceUrl.mockReturnValue('/doc');

    TestBed.configureTestingModule({
      imports: [DocumentationComponent],
      providers: [
        { provide: RequestService, useValue: requestServiceMock },
        { provide: DomSanitizer, useValue: domSanitizerMock },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set doc uri', () => {
    documentationSubject.next('/doc');

    expect(component.docUri).toEqual('/doc');
  });

  it('should log error on document observable error', () => {
    vi.spyOn(window.console, 'error');
    documentationSubject.error('my error');

    expect(window.console.error).toHaveBeenCalled();
  });

  it('should unset doc uri on response arrival', () => {
    documentationSubject.next('/doc');
    responseSubject.next('response');

    expect(component.docUri).toBeUndefined();
  });

  it('should update iframe height on window resize', () => {
    // Mock window.innerHeight
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    });

    // Trigger resize event
    component.onResize();

    // Height should be calculated: 800 - 56 (navbar) - 90 (header) - 10 (padding) + 20 (additional) = 664px
    expect(component.iframeHeight).toBe('664px');
  });
});
