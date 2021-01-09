import { ComponentFixture, getTestBed, TestBed, waitForAsync } from '@angular/core/testing';

import { ResponseDetailsComponent } from './response-details.component';
import { Command, RequestService } from '../request/request.service';
import { JsonHighlighterService } from '../json-highlighter/json-highlighter.service';
import { HttpHeaders, HttpResponse } from '@angular/common/http';

class ObservableMock {
  private callback: (value: HttpResponse<any>) => void;
  hasSubscribed = false;

  subscribe(next?: (value: HttpResponse<any>) => void, error?: (error: any) => void) {
    this.callback = next;
    this.hasSubscribed = true;
  }

  next(response: HttpResponse<any>) {
    this.callback( response );
  }
}

class RequestServiceMock {
  observableMock: ObservableMock = new ObservableMock();
  requestServiceProcessCommandInvoked = false;

  public getResponseObservable() {
    return this.observableMock;
  }

  public processCommand(command: Command, link: string) {
    this.requestServiceProcessCommandInvoked = true;
  }
}

class JsonHighlighterServiceMock {
  syntaxHighlight() {
    // console.log('syntaxHighlight invoked');
  }
}

describe( 'ResponseDetailsComponent', () => {
  let component: ResponseDetailsComponent;
  let fixture: ComponentFixture<ResponseDetailsComponent>;

  beforeEach( waitForAsync( () => {
    TestBed.configureTestingModule( {
      declarations: [ResponseDetailsComponent],
      providers: [
        { provide: RequestService, useClass: RequestServiceMock },
        { provide: JsonHighlighterService, useClass: JsonHighlighterServiceMock }
      ]
    } ).compileComponents();
  } ) );

  beforeEach( () => {
    fixture = TestBed.createComponent( ResponseDetailsComponent );
    component = fixture.componentInstance;
    fixture.detectChanges();
  } );

  it( 'should create', () => {
    expect( component ).toBeTruthy();
  } );

  it( 'should handle json HTTP response', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().inject( RequestService ) as any;

    requestServiceMock.getResponseObservable().next( new HttpResponse( { body: { key: 'test' } } ) );

    expect( component.responseStatus ).toBe( 200 );
    expect( component.isString ).toBeFalsy();
  } );

  it( 'should handle string HTTP response', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().inject( RequestService ) as any;

    requestServiceMock.getResponseObservable().next( new HttpResponse( { body: 'string' } ) );

    expect( component.responseStatus ).toBe( 200 );
    expect( component.isString ).toBeTruthy();
  } );

  it( 'should handle HTTP response headers', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().inject( RequestService ) as any;
    const responseHeaders: HttpHeaders = new HttpHeaders(
      {
        key: 'value'
      } );
    requestServiceMock.getResponseObservable().next( new HttpResponse( { headers: responseHeaders } ) );

    expect( component.responseStatus ).toBe( 200 );
    expect( component.responseHeaders.length ).toBe( 1 );
  } );

  it( 'should handle HTTP response status 0', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().inject( RequestService ) as any;
    requestServiceMock.getResponseObservable().next( new HttpResponse( { status: 0 } ) );

    expect( component.responseStatus ).toBe( 0 );
    expect( component.responseStatusText ).toBe( '' );
  } );
} );
