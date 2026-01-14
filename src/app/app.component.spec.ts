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

  it('should blur active element when blurActiveElement is called', () => {
    // Create a button and focus it
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();

    // Verify button has focus
    expect(document.activeElement).toBe(button);

    // Call blurActiveElement
    component.blurActiveElement();

    // Verify button no longer has focus
    expect(document.activeElement).not.toBe(button);

    // Cleanup
    document.body.removeChild(button);
  });

  it('should handle blurActiveElement when no element has focus', () => {
    // Ensure body has focus (or no specific element)
    document.body.focus();

    // Should not throw error
    expect(() => component.blurActiveElement()).not.toThrow();
  });

  describe('Resizable Columns', () => {
    it('should initialize with default column widths in 3-column layout', () => {
      // Create a new component with 3-column layout
      const appServiceMock = TestBed.inject(AppService);
      (appServiceMock as any).getColumnLayout.mockReturnValue('3');

      const newFixture = TestBed.createComponent(AppComponent);
      const newComponent = newFixture.componentInstance;
      newComponent.isTwoColumnLayout = false;
      newFixture.detectChanges();

      expect(newComponent.column1Width()).toBeCloseTo(33.33, 1);
      expect(newComponent.column2Width()).toBeCloseTo(33.33, 1);
      expect(newComponent.column3Width()).toBeCloseTo(33.34, 1);
    });

    it('should initialize with default column widths in 2-column layout', () => {
      component.isTwoColumnLayout = true;
      expect(component.column1Width()).toBeCloseTo(33.33, 1);
      // In 2-column layout, column2 is 100% - column1
      expect(component.column2Width()).toBeCloseTo(66.67, 1);
    });

    it('should start resize operation on mousedown', () => {
      const mouseEvent = new MouseEvent('mousedown', { clientX: 100, cancelable: true });
      component.startResize(mouseEvent, 1);

      // After starting resize, preventDefault should have been called
      expect(mouseEvent.defaultPrevented).toBe(true);
    });

    it('should resize columns in 2-column layout', () => {
      component.isTwoColumnLayout = true;
      const initialWidth = component.column1Width();

      // Start resize
      const startEvent = new MouseEvent('mousedown', { clientX: 100 });
      component.startResize(startEvent, 1);

      // Simulate mouse move (creating a mock container)
      const mockContainer = document.createElement('div');
      mockContainer.className = 'resizable-layout';
      Object.defineProperty(mockContainer, 'clientWidth', { value: 1000 });
      document.body.appendChild(mockContainer);

      const moveEvent = new MouseEvent('mousemove', { clientX: 200 });
      document.dispatchEvent(moveEvent);

      // Width should have changed
      expect(component.column1Width()).not.toBe(initialWidth);

      // Cleanup
      document.body.removeChild(mockContainer);
      document.dispatchEvent(new MouseEvent('mouseup'));
    });

    it('should resize columns in 3-column layout', () => {
      component.isTwoColumnLayout = false;
      const initialColumn1Width = component.column1Width();
      const initialColumn2Width = component.column2Width();

      // Start resize
      const startEvent = new MouseEvent('mousedown', { clientX: 100 });
      component.startResize(startEvent, 1);

      // Simulate mouse move (creating a mock container)
      const mockContainer = document.createElement('div');
      mockContainer.className = 'resizable-layout';
      Object.defineProperty(mockContainer, 'clientWidth', { value: 1000 });
      document.body.appendChild(mockContainer);

      const moveEvent = new MouseEvent('mousemove', { clientX: 200 });
      document.dispatchEvent(moveEvent);

      // Widths should have changed
      expect(component.column1Width()).not.toBe(initialColumn1Width);
      expect(component.column2Width()).not.toBe(initialColumn2Width);

      // Cleanup
      document.body.removeChild(mockContainer);
      document.dispatchEvent(new MouseEvent('mouseup'));
    });

    it('should enforce minimum column width', () => {
      component.isTwoColumnLayout = true;

      // Start resize
      const startEvent = new MouseEvent('mousedown', { clientX: 100 });
      component.startResize(startEvent, 1);

      // Simulate extreme drag (creating a mock container)
      const mockContainer = document.createElement('div');
      mockContainer.className = 'resizable-layout';
      Object.defineProperty(mockContainer, 'clientWidth', { value: 1000 });
      document.body.appendChild(mockContainer);

      const moveEvent = new MouseEvent('mousemove', { clientX: -1000 });
      document.dispatchEvent(moveEvent);

      // Column width should not go below minimum (10%)
      expect(component.column1Width()).toBeGreaterThanOrEqual(10);

      // Cleanup
      document.body.removeChild(mockContainer);
      document.dispatchEvent(new MouseEvent('mouseup'));
    });

    it('should resize columns 2 and 3 when using handle index 2', () => {
      // Clear localStorage and create a fresh component instance
      localStorage.removeItem('hal-explorer.columnWidths');

      // Set up 3-column layout in the service mock
      const appServiceMock = TestBed.inject(AppService);
      (appServiceMock as any).getColumnLayout.mockReturnValue('3');

      // Create fresh component instance
      const newFixture = TestBed.createComponent(AppComponent);
      const newComponent = newFixture.componentInstance;
      newComponent.isTwoColumnLayout = false;
      newComponent['column1WidthSignal'].set(33.33);
      newComponent['column2WidthSignal'].set(33.33);
      newComponent['column3WidthSignal'].set(33.34);
      newFixture.detectChanges();

      const initialColumn1Width = newComponent.column1Width();
      const initialColumn2Width = newComponent.column2Width();
      const initialColumn3Width = newComponent.column3Width();

      // Verify initial state is correct
      expect(initialColumn1Width).toBeCloseTo(33.33, 1);
      expect(initialColumn2Width).toBeCloseTo(33.33, 1);
      expect(initialColumn3Width).toBeCloseTo(33.34, 1);

      // Start resize on handle 2 (between column 2 and 3)
      const startEvent = new MouseEvent('mousedown', { clientX: 100 });
      newComponent.startResize(startEvent, 2);

      // Simulate mouse move (creating a mock container)
      const mockContainer = document.createElement('div');
      mockContainer.className = 'resizable-layout';
      Object.defineProperty(mockContainer, 'clientWidth', { value: 1000 });
      document.body.appendChild(mockContainer);

      // Move mouse to the right (increase column 2, decrease column 3)
      const moveEvent = new MouseEvent('mousemove', { clientX: 200 });
      document.dispatchEvent(moveEvent);

      // Column 2 should increase, column 3 should decrease
      expect(newComponent.column2Width()).toBeGreaterThan(initialColumn2Width);
      expect(newComponent.column3Width()).toBeLessThan(initialColumn3Width);

      // Column 1 should remain unchanged
      expect(newComponent.column1Width()).toBeCloseTo(initialColumn1Width, 1);

      // Cleanup
      document.body.removeChild(mockContainer);
      document.dispatchEvent(new MouseEvent('mouseup'));
    });

    it('should enforce minimum width when resizing columns 2 and 3', () => {
      component.isTwoColumnLayout = false;

      // Start resize on handle 2
      const startEvent = new MouseEvent('mousedown', { clientX: 100 });
      component.startResize(startEvent, 2);

      // Simulate mouse move (creating a mock container)
      const mockContainer = document.createElement('div');
      mockContainer.className = 'resizable-layout';
      Object.defineProperty(mockContainer, 'clientWidth', { value: 1000 });
      document.body.appendChild(mockContainer);

      // Try to drag extremely to the left (attempt to make column 2 very small)
      const moveEvent = new MouseEvent('mousemove', { clientX: -1000 });
      document.dispatchEvent(moveEvent);

      // Both columns should respect minimum width of 10%
      expect(component.column2Width()).toBeGreaterThanOrEqual(10);
      expect(component.column3Width()).toBeGreaterThanOrEqual(10);

      // Cleanup
      document.body.removeChild(mockContainer);
      document.dispatchEvent(new MouseEvent('mouseup'));
    });

    it('should save column widths to localStorage', () => {
      const setItemSpy = vi.fn();
      Storage.prototype.setItem = setItemSpy;

      // Trigger a column width change
      component['column1WidthSignal'].set(40);

      // Wait for effect to run
      fixture.detectChanges();

      // Verify localStorage was updated (effect should have been triggered)
      expect(setItemSpy).toHaveBeenCalledWith('hal-explorer.columnWidths', expect.stringContaining('"column1":40'));
    });

    it('should start resize operation on touchstart', () => {
      const touch = { clientX: 100 };
      const touchEvent = new TouchEvent('touchstart', {
        touches: [touch as Touch],
        cancelable: true,
      });
      component.startResize(touchEvent, 1);

      // After starting resize, preventDefault should have been called
      expect(touchEvent.defaultPrevented).toBe(true);
      expect(component.resizingHandle()).toBe(1);
    });

    it('should resize columns in 2-column layout with touch events', () => {
      component.isTwoColumnLayout = true;
      const initialWidth = component.column1Width();

      // Start resize with touch
      const startTouch = { clientX: 100 };
      const startEvent = new TouchEvent('touchstart', {
        touches: [startTouch as Touch],
        cancelable: true,
      });
      component.startResize(startEvent, 1);

      // Simulate touch move (creating a mock container)
      const mockContainer = document.createElement('div');
      mockContainer.className = 'resizable-layout';
      Object.defineProperty(mockContainer, 'clientWidth', { value: 1000 });
      document.body.appendChild(mockContainer);

      const moveTouch = { clientX: 200 };
      const moveEvent = new TouchEvent('touchmove', {
        touches: [moveTouch as Touch],
        cancelable: true,
      });
      document.dispatchEvent(moveEvent);

      // Width should have changed
      expect(component.column1Width()).not.toBe(initialWidth);

      // Cleanup
      document.body.removeChild(mockContainer);
      document.dispatchEvent(new TouchEvent('touchend'));
    });

    it('should prevent default behavior on touch move during resize', () => {
      component.isTwoColumnLayout = true;

      // Start resize with touch
      const startTouch = { clientX: 100 };
      const startEvent = new TouchEvent('touchstart', {
        touches: [startTouch as Touch],
        cancelable: true,
      });
      component.startResize(startEvent, 1);

      // Create mock container
      const mockContainer = document.createElement('div');
      mockContainer.className = 'resizable-layout';
      Object.defineProperty(mockContainer, 'clientWidth', { value: 1000 });
      document.body.appendChild(mockContainer);

      // Create a touch move event
      const moveTouch = { clientX: 150 };
      const moveEvent = new TouchEvent('touchmove', {
        touches: [moveTouch as Touch],
        cancelable: true,
      });

      // Dispatch the event
      document.dispatchEvent(moveEvent);

      // preventDefault should have been called to prevent scrolling
      expect(moveEvent.defaultPrevented).toBe(true);

      // Cleanup
      document.body.removeChild(mockContainer);
      document.dispatchEvent(new TouchEvent('touchend'));
    });

    it('should handle touchcancel event during resize', () => {
      component.isTwoColumnLayout = true;

      // Start resize with touch
      const startTouch = { clientX: 100 };
      const startEvent = new TouchEvent('touchstart', {
        touches: [startTouch as Touch],
        cancelable: true,
      });
      component.startResize(startEvent, 1);

      expect(component.resizingHandle()).toBe(1);

      // Trigger touchcancel
      document.dispatchEvent(new TouchEvent('touchcancel'));

      // Resizing should be cancelled
      expect(component.resizingHandle()).toBeNull();
    });

    it('should resize columns 2 and 3 with touch events', () => {
      // Clear localStorage and create a fresh component with 3-column layout
      localStorage.removeItem('hal-explorer.columnWidths');

      const appServiceMock = TestBed.inject(AppService);
      (appServiceMock as any).getColumnLayout.mockReturnValue('3');

      const newFixture = TestBed.createComponent(AppComponent);
      const newComponent = newFixture.componentInstance;
      newComponent.isTwoColumnLayout = false;
      newComponent['column1WidthSignal'].set(33.33);
      newComponent['column2WidthSignal'].set(33.33);
      newComponent['column3WidthSignal'].set(33.34);
      newFixture.detectChanges();

      const initialColumn2Width = newComponent['column2WidthSignal']();
      const initialColumn3Width = newComponent['column3WidthSignal']();

      // Start resize on handle 2 with touch
      const startTouch = { clientX: 100 };
      const startEvent = new TouchEvent('touchstart', {
        touches: [startTouch as Touch],
        cancelable: true,
      });
      newComponent.startResize(startEvent, 2);

      // Simulate touch move
      const mockContainer = document.createElement('div');
      mockContainer.className = 'resizable-layout';
      Object.defineProperty(mockContainer, 'clientWidth', { value: 1000 });
      document.body.appendChild(mockContainer);

      const moveTouch = { clientX: 200 };
      const moveEvent = new TouchEvent('touchmove', {
        touches: [moveTouch as Touch],
        cancelable: true,
      });
      document.dispatchEvent(moveEvent);

      // Column 2 signal should increase, column 3 signal should decrease
      expect(newComponent['column2WidthSignal']()).toBeGreaterThan(initialColumn2Width);
      expect(newComponent['column3WidthSignal']()).toBeLessThan(initialColumn3Width);

      // Cleanup
      document.body.removeChild(mockContainer);
      document.dispatchEvent(new TouchEvent('touchend'));
    });

    it('should load saved column widths from localStorage', () => {
      const savedWidths = {
        column1: 40,
        column2: 35,
        column3: 25,
      };

      // Store original getItem
      const originalGetItem = Storage.prototype.getItem;

      // Mock getItem to return saved widths
      Storage.prototype.getItem = vi.fn((key: string) => {
        if (key === 'hal-explorer.columnWidths') {
          return JSON.stringify(savedWidths);
        }
        return null;
      });

      // Create new component instance
      const newFixture = TestBed.createComponent(AppComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      // Verify saved widths were loaded
      expect(newComponent['column1WidthSignal']()).toBe(40);
      expect(newComponent['column2WidthSignal']()).toBe(35);
      expect(newComponent['column3WidthSignal']()).toBe(25);

      // Restore original
      Storage.prototype.getItem = originalGetItem;
    });

    it('should handle invalid JSON in localStorage for column widths', () => {
      // Store original getItem
      const originalGetItem = Storage.prototype.getItem;

      // Mock getItem to return invalid JSON
      Storage.prototype.getItem = vi.fn((key: string) => {
        if (key === 'hal-explorer.columnWidths') {
          return 'invalid-json{]';
        }
        return null;
      });

      // Should not throw error
      expect(() => {
        const newFixture = TestBed.createComponent(AppComponent);
        newFixture.detectChanges();
      }).not.toThrow();

      // Restore original
      Storage.prototype.getItem = originalGetItem;
    });

    it('should stop propagation of events during resize', () => {
      const mouseEvent = new MouseEvent('mousedown', { clientX: 100, cancelable: true, bubbles: true });
      const stopPropagationSpy = vi.spyOn(mouseEvent, 'stopPropagation');

      component.startResize(mouseEvent, 1);

      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });
});
