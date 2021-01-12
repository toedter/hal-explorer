import { ComponentFixture, getTestBed, TestBed, waitForAsync } from '@angular/core/testing';
import {AppComponent} from './app.component';
import {Component} from '@angular/core';
import {AppService} from './app.service';
import {RequestService} from './request/request.service';
import {DomSanitizer} from '@angular/platform-browser';

@Component({
  selector: 'app-uri-input',
  template: ''
})
class MockRequestComponent {
}

@Component({
  selector: 'app-response-explorer',
  template: ''
})
class MockResponseExplorerComponent {
}

@Component({
  selector: 'app-response-details',
  template: ''
})
class MockResponseDetailsComponent {
}

@Component({
  selector: 'app-documentation',
  template: ''
})
class MockDocumentationComponent {
}

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

class AppServiceMock {
  themeObservable: ObservableMock = new ObservableMock();
  layoutObservable: ObservableMock = new ObservableMock();

  getTheme(): string {
    return 'Default';
  }

  setTheme(theme: string) {
  }

  getLayout(): string {
    return '2 Columns';
  }

  setLayout(layout: string) {
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

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        MockRequestComponent,
        MockResponseExplorerComponent,
        MockResponseDetailsComponent,
        MockDocumentationComponent
      ],
      providers: [
        {provide: AppService, useClass: AppServiceMock},
        {provide: RequestService, useClass: RequestServiceMock},
        {provide: DomSanitizer, useClass: DomSanitizerMock}
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
    const requestServiceMock: RequestServiceMock = getTestBed().inject(RequestService) as any;

    requestServiceMock.documentationObservableMock.next('/doc');

    expect(component.showDocumentation).toBeTruthy();
  });

  it('should not show documentation after getting response', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().inject(RequestService) as any;

    requestServiceMock.documentationObservableMock.next('/doc');
    requestServiceMock.responseObservableMock.next('response');

    expect(component.showDocumentation).toBeFalsy();
  });

  it('should change theme', () => {
    component.changeTheme('Cosmo');

    expect(component.isCustomTheme).toBeTruthy();
  });

});
