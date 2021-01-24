import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';

import {ResponseDetailsComponent} from './response-details.component';
import {RequestService} from '../request/request.service';
import {JsonHighlighterService} from '../json-highlighter/json-highlighter.service';
import {HttpHeaders, HttpResponse} from '@angular/common/http';
import {Subject} from 'rxjs';

describe( 'ResponseDetailsComponent', () => {
  let component: ResponseDetailsComponent;
  let fixture: ComponentFixture<ResponseDetailsComponent>;
  let responseSubject;

  beforeEach( waitForAsync( () => {
    const requestServiceMock = jasmine.createSpyObj(['getResponseObservable']);
    responseSubject = new Subject<string>();
    requestServiceMock.getResponseObservable.and.returnValue(responseSubject);

    const jsonHighlighterServiceMock = jasmine.createSpyObj(['syntaxHighlight']);

    TestBed.configureTestingModule( {
      declarations: [ResponseDetailsComponent],
      providers: [
        { provide: RequestService, useValue: requestServiceMock },
        { provide: JsonHighlighterService, useValue: jsonHighlighterServiceMock }
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
    responseSubject.next( new HttpResponse( { body: { key: 'test' } } ) );

    expect( component.responseStatus ).toBe( 200 );
    expect( component.isString ).toBeFalsy();
  } );

  it( 'should handle string HTTP response', () => {
    responseSubject.next( new HttpResponse( { body: 'string' } ) );

    expect( component.responseStatus ).toBe( 200 );
    expect( component.isString ).toBeTruthy();
  } );

  it( 'should handle HTTP response headers', () => {
    const responseHeaders: HttpHeaders = new HttpHeaders(
      {
        key: 'value'
      } );
    responseSubject.next( new HttpResponse( { headers: responseHeaders } ) );

    expect( component.responseStatus ).toBe( 200 );
    expect( component.responseHeaders.length ).toBe( 1 );
  } );

  it( 'should handle HTTP response status 0', () => {
    responseSubject.next( new HttpResponse( { status: 0 } ) );

    expect( component.responseStatus ).toBe( 0 );
    expect( component.responseStatusText ).toBe( '' );
  } );
} );
