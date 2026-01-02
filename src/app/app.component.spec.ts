import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AppService, RequestHeader } from './app.service';
import { RequestService } from './request/request.service';
import { DomSanitizer } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

  beforeEach(async () => {
    const requestServiceMock = {
      getResponseObservable: vi.fn(),
      getNeedInfoObservable: vi.fn(),
      getLoadingObservable: vi.fn(),
      setCustomHeaders: vi.fn(),
      getUri: vi.fn(),
      getInputType: vi.fn(),
      requestUri: vi.fn(),
      computeHalFormsOptionsFromLink: vi.fn(),
      getDocumentationObservable: vi.fn(),
    };
    const needInfoSubject = new Subject<string>();
    responseSubject = new Subject<string>();
    documentationSubject = new Subject<string>();
    requestServiceMock.getResponseObservable.mockReturnValue(responseSubject);
    requestServiceMock.getNeedInfoObservable.mockReturnValue(needInfoSubject);
    requestServiceMock.getLoadingObservable.mockReturnValue(new Subject<boolean>());
    requestServiceMock.getUri.mockReturnValue('http://localhost/api');
    requestServiceMock.getInputType.mockReturnValue('number');
    requestServiceMock.computeHalFormsOptionsFromLink.mockImplementation(property => {
      property.options.inline = ['a', 'b'];
    });
    requestServiceMock.getDocumentationObservable.mockReturnValue(documentationSubject);

    themeSubject = new Subject<string>();
    layoutSubject = new Subject<string>();
    httpOptionsSubject = new Subject<boolean>();
    allHttpMethodsForLinksSubject = new Subject<boolean>();
    scrollableDocumentationSubject = new Subject<boolean>();

    const uriSubject = new Subject<string>();
    const requestHeaderSubject = new Subject<RequestHeader[]>();
    const appServiceMock = {
      getUri: vi.fn(),
      getCustomRequestHeaders: vi.fn(),
      setCustomRequestHeaders: vi.fn(),
      getTheme: vi.fn(),
      setTheme: vi.fn((theme: string) => themeSubject.next(theme)),
      getColumnLayout: vi.fn(),
      setColumnLayout: vi.fn(),
      getHttpOptions: vi.fn(),
      setHttpOptions: vi.fn(),
      getAllHttpMethodsForLinks: vi.fn(),
      setAllHttpMethodsForLinks: vi.fn(),
      getScrollableDocumentation: vi.fn(),
      setScrollableDocumentation: vi.fn(),
      themeObservable: themeSubject,
      columnLayoutObservable: layoutSubject,
      httpOptionsObservable: httpOptionsSubject,
      allHttpMethodsForLinksObservable: allHttpMethodsForLinksSubject,
      scrollableDocumentationObservable: scrollableDocumentationSubject,
      uriObservable: uriSubject,
      requestHeadersObservable: requestHeaderSubject,
    };

    appServiceMock.getUri.mockReturnValue('http://localhost/api');
    appServiceMock.getCustomRequestHeaders.mockReturnValue([]);

    appServiceMock.getTheme.mockReturnValue('Bootstrap Default');
    appServiceMock.getColumnLayout.mockReturnValue('2');
    appServiceMock.getHttpOptions.mockReturnValue(false);
    appServiceMock.getAllHttpMethodsForLinks.mockReturnValue(false);
    appServiceMock.getScrollableDocumentation.mockReturnValue(false);
    const domSanitizerMock = {
      bypassSecurityTrustResourceUrl: vi.fn(),
    };
    // Return a mock SafeResourceUrl object
    domSanitizerMock.bypassSecurityTrustResourceUrl.mockReturnValue({
      changingThisBreaksApplicationSecurity: 'https://bootswatch.com/5/cosmo/bootstrap.min.css',
    });

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
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it(`should not show documentation`, () => {
    expect(component.showDocumentation).toBeFalsy();
  });

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

    expect(component.isTwoColumnLayout).toBe(true);
  });

  it('should react on HTTP OPTIONS change', () => {
    httpOptionsSubject.next(true);

    expect(component.useHttpOptions).toBe(true);
  });

  it('should select settings (HTTP OPTIONS)', () => {
    component.selectSetting('Use HTTP OPTIONS');

    expect(component.useHttpOptions).toBe(true);
  });

  it('should react on Link methods change', () => {
    allHttpMethodsForLinksSubject.next(true);

    expect(component.enableAllHttpMethodsForLinks).toBe(true);
  });

  it('should select settings (Link methods)', () => {
    component.selectSetting('Enable all HTTP Methods for HAL-FORMS Links');

    expect(component.enableAllHttpMethodsForLinks).toBe(true);
  });

  it('should select settings (Layout)', () => {
    component.selectSetting('2 Column Layout');

    expect(component.isTwoColumnLayout).toBe(true);
  });

  it('should react on scrollable documentation change', () => {
    scrollableDocumentationSubject.next(true);

    expect(component.scrollableDocumentation).toBe(true);
  });

  it('should select settings (Scrollable Documentation)', () => {
    component.selectSetting('Scrollable Documentation');

    expect(component.scrollableDocumentation).toBe(true);
  });

  it('should initialize color mode from localStorage', () => {
    // Store original getItem
    const originalGetItem = Storage.prototype.getItem;

    // Mock getItem before component creation
    Storage.prototype.getItem = vi.fn((key: string) => {
      if (key === 'hal-explorer.colorMode') return 'dark';
      return null;
    });

    const newFixture = TestBed.createComponent(AppComponent);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();

    expect(newComponent.activeColorMode).toBe('dark');

    // Restore original
    Storage.prototype.getItem = originalGetItem;
  });

  it('should initialize color mode to auto when not in localStorage', () => {
    // Store original getItem
    const originalGetItem = Storage.prototype.getItem;

    // Mock getItem to return null
    Storage.prototype.getItem = vi.fn(() => null);

    const newFixture = TestBed.createComponent(AppComponent);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();

    expect(newComponent.activeColorMode).toBe('auto');

    // Restore original
    Storage.prototype.getItem = originalGetItem;
  });

  it('should set color mode to light', () => {
    const setItemSpy = vi.fn();
    Storage.prototype.setItem = setItemSpy;

    component.setColorMode('light');

    expect(component.activeColorMode).toBe('light');
    expect(setItemSpy).toHaveBeenCalledWith('hal-explorer.colorMode', 'light');
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('light');
  });

  it('should set color mode to dark', () => {
    const setItemSpy = vi.fn();
    Storage.prototype.setItem = setItemSpy;

    component.setColorMode('dark');

    expect(component.activeColorMode).toBe('dark');
    expect(setItemSpy).toHaveBeenCalledWith('hal-explorer.colorMode', 'dark');
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
  });

  it('should set color mode to auto and detect system preference', () => {
    const setItemSpy = vi.fn();
    Storage.prototype.setItem = setItemSpy;

    // Mock matchMedia to return dark preference
    const originalMatchMedia = globalThis.matchMedia;
    globalThis.matchMedia = vi.fn().mockReturnValue({ matches: true } as MediaQueryList);

    component.setColorMode('auto');

    expect(component.activeColorMode).toBe('auto');
    expect(setItemSpy).toHaveBeenCalledWith('hal-explorer.colorMode', 'auto');
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');

    // Restore original
    globalThis.matchMedia = originalMatchMedia;
  });
});
