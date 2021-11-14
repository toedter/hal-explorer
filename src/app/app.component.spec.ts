import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {AppComponent} from './app.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {AppService} from './app.service';
import {RequestService} from './request/request.service';
import {DomSanitizer} from '@angular/platform-browser';
import {Subject} from 'rxjs';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let documentationSubject;
  let responseSubject;
  let themeSubject;
  let layoutSubject;
  let httpOptionsSubject;

  beforeEach(waitForAsync(() => {
    const requestServiceMock = jasmine.createSpyObj(['getResponseObservable', 'getDocumentationObservable']);
    documentationSubject = new Subject<string>();
    responseSubject = new Subject<string>();
    requestServiceMock.getDocumentationObservable.and.returnValue(documentationSubject);
    requestServiceMock.getResponseObservable.and.returnValue(responseSubject);

    themeSubject = new Subject<string>();
    layoutSubject = new Subject<string>();
    httpOptionsSubject = new Subject<boolean>();

    const appServiceMock = jasmine.createSpyObj(['getTheme', 'setTheme', 'getLayout', 'setLayout', 'getHttpOptions', 'setHttpOptions'],
      {themeObservable: themeSubject, layoutObservable: layoutSubject, httpOptionsObservable: httpOptionsSubject});
    appServiceMock.getTheme.and.returnValue('Default');
    appServiceMock.getLayout.and.returnValue('2');
    appServiceMock.getHttpOptions.and.returnValue(false);
    const domSanitizerMock = jasmine.createSpyObj(['bypassSecurityTrustResourceUrl']);

    TestBed.configureTestingModule({
      declarations: [
        AppComponent
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {provide: AppService, useValue: appServiceMock},
        {provide: RequestService, useValue: requestServiceMock},
        {provide: DomSanitizer, useValue: domSanitizerMock}
      ]
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
    component.selectSetting('Use HTTP OPTIONS')

    expect(component.useHttpOptions).toBeTrue();
  });

  it('should select settings (Layout)', () => {
    component.selectSetting('2 Column Layout')

    expect(component.isTwoColumnLayout).toBeTrue();
  });

});
