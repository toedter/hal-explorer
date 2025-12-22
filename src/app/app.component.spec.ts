import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AppService, RequestHeader } from './app.service';
import { RequestService } from './request/request.service';
import { DomSanitizer } from '@angular/platform-browser';
import { Subject } from 'rxjs';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let documentationSubject;
  let responseSubject;
  let themeSubject;
  let layoutSubject;
  let httpOptionsSubject;
  let allHttpMethodsForLinksSubject;
  let scrollableDocumentationSubject;

  beforeEach(waitForAsync(() => {
    const requestServiceMock = jasmine.createSpyObj([
      'getResponseObservable',
      'getNeedInfoObservable',
      'getLoadingObservable',
      'setCustomHeaders',
      'getUri',
      'getInputType',
      'requestUri',
      'computeHalFormsOptionsFromLink',
      'getDocumentationObservable',
    ]);
    const needInfoSubject = new Subject<string>();
    responseSubject = new Subject<string>();
    documentationSubject = new Subject<string>();
    requestServiceMock.getResponseObservable.and.returnValue(responseSubject);
    requestServiceMock.getNeedInfoObservable.and.returnValue(needInfoSubject);
    requestServiceMock.getLoadingObservable.and.returnValue(new Subject<boolean>());
    requestServiceMock.getUri.and.returnValue('http://localhost/api');
    requestServiceMock.getInputType.and.returnValue('number');
    requestServiceMock.computeHalFormsOptionsFromLink.and.callFake(property => {
      property.options.inline = ['a', 'b'];
    });
    requestServiceMock.getDocumentationObservable.and.returnValue(documentationSubject);

    themeSubject = new Subject<string>();
    layoutSubject = new Subject<string>();
    httpOptionsSubject = new Subject<boolean>();
    allHttpMethodsForLinksSubject = new Subject<boolean>();
    scrollableDocumentationSubject = new Subject<boolean>();

    const uriSubject = new Subject<string>();
    const requestHeaderSubject = new Subject<RequestHeader[]>();
    const appServiceMock = jasmine.createSpyObj(
      [
        'getUri',
        'getCustomRequestHeaders',
        'setCustomRequestHeaders',
        'getTheme',
        'setTheme',
        'getLayout',
        'setLayout',
        'getHttpOptions',
        'setHttpOptions',
        'getAllHttpMethodsForLinks',
        'setAllHttpMethodsForLinks',
        'getScrollableDocumentation',
        'setScrollableDocumentation',
      ],
      {
        themeObservable: themeSubject,
        layoutObservable: layoutSubject,
        httpOptionsObservable: httpOptionsSubject,
        allHttpMethodsForLinksObservable: allHttpMethodsForLinksSubject,
        scrollableDocumentationObservable: scrollableDocumentationSubject,
        uriObservable: uriSubject,
        requestHeadersObservable: requestHeaderSubject,
      }
    );

    appServiceMock.getUri.and.returnValue('http://localhost/api');
    appServiceMock.getCustomRequestHeaders.and.returnValue([]);

    appServiceMock.getTheme.and.returnValue('Default');
    appServiceMock.getLayout.and.returnValue('2');
    appServiceMock.getHttpOptions.and.returnValue(false);
    appServiceMock.getAllHttpMethodsForLinks.and.returnValue(false);
    appServiceMock.getScrollableDocumentation.and.returnValue(false);
    const domSanitizerMock = jasmine.createSpyObj(['bypassSecurityTrustResourceUrl']);

    TestBed.configureTestingModule({
      imports: [AppComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: AppService, useValue: appServiceMock },
        { provide: RequestService, useValue: requestServiceMock },
        { provide: DomSanitizer, useValue: domSanitizerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create the app', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));

  it(`should not show documentation`, waitForAsync(() => {
    expect(component.showDocumentation).toBeFalsy();
  }));

  it('should show documentation', () => {
    documentationSubject.next('/doc');

    expect(component.showDocumentation).toBeTruthy();
  });

  it('should not show documentation after getting response', () => {
    documentationSubject.next('/doc');
    responseSubject.next('response');

    expect(component.showDocumentation).toBeFalsy();
  });

  it('should change theme', () => {
    component.changeTheme('Cosmo');

    expect(component.isCustomTheme).toBeTruthy();
  });

  it('should react on theme change', () => {
    themeSubject.next('Cosmo');

    expect(component.isCustomTheme).toBeTruthy();
  });

  it('should react on dark theme change', () => {
    themeSubject.next('Dark');

    expect(component.isCustomTheme).toBeTruthy();
  });

  it('should react on layout change', () => {
    layoutSubject.next('2');

    expect(component.isTwoColumnLayout).toBeTrue();
  });

  it('should react on HTTP OPTIONS change', () => {
    httpOptionsSubject.next(true);

    expect(component.useHttpOptions).toBeTrue();
  });

  it('should select settings (HTTP OPTIONS)', () => {
    component.selectSetting('Use HTTP OPTIONS');

    expect(component.useHttpOptions).toBeTrue();
  });

  it('should react on Link methods change', () => {
    allHttpMethodsForLinksSubject.next(true);

    expect(component.enableAllHttpMethodsForLinks).toBeTrue();
  });

  it('should select settings (Link methods)', () => {
    component.selectSetting('Enable all HTTP Methods for HAL-FORMS Links');

    expect(component.enableAllHttpMethodsForLinks).toBeTrue();
  });

  it('should select settings (Layout)', () => {
    component.selectSetting('2 Column Layout');

    expect(component.isTwoColumnLayout).toBeTrue();
  });

  it('should react on scrollable documentation change', () => {
    scrollableDocumentationSubject.next(true);

    expect(component.scrollableDocumentation).toBeTrue();
  });

  it('should select settings (Scrollable Documentation)', () => {
    component.selectSetting('Scrollable Documentation');

    expect(component.scrollableDocumentation).toBeTrue();
  });
});
