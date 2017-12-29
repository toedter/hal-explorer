import {async, TestBed} from '@angular/core/testing';
import {AppComponent} from './app.component';
import {Component} from '@angular/core';
import {AppService} from './app.service';
import {RequestService} from './request/request.service';

describe('AppComponent', () => {
  beforeEach(async(() => {
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
        {provide: RequestService, useClass: RequestServiceMock}
      ]
    }).compileComponents();
  }));
  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
  it(`should not show documentation`, async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.showDocumentation).toEqual(false);
  }));
});

@Component({
  selector: 'app-url-input',
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

class AppServiceMock {
}

class RequestServiceMock {
}

