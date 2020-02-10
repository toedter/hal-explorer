import { async, ComponentFixture, getTestBed, TestBed } from '@angular/core/testing';

import { ResponseExplorerComponent } from './response-explorer.component';
import { Command, RequestService } from '../request/request.service';
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { JsonHighlighterService } from '../json-highlighter/json-highlighter.service';

/* tslint:disable */
const halFormsResponse = {
  'title': 'The Shawshank Redemption',
  'year': 1994,
  '_links': {
    'self': {
      'href': 'http://localhost:4200/api/movies/1'
    },
    'movies': {
      'href': 'http://localhost:4200/api/movies{?size,page}',
      'templated': true
    }
  },
  '_templates': {
    'default': {
      'title': 'Ändere Film',
      'method': 'put',
      'contentType': '',
      'properties': [
        {
          'name': 'title',
          'prompt': 'Titel',
          'required': true
        },
        {
          'name': 'year',
          'prompt': 'Jahr',
          'required': true
        }
      ]
    },
    'updateMoviePartially': {
      'title': 'Ändere Film (partiell)',
      'method': 'patch',
      'contentType': '',
      'properties': [
        {
          'name': 'title',
          'prompt': 'Titel',
          'required': false
        },
        {
          'name': 'year',
          'prompt': 'Jahr',
          'required': false
        }
      ]
    },
    'deleteMovie': {
      'title': 'Lösche Film',
      'method': 'delete',
      'contentType': '',
      'properties': []
    }
  }
};

/* tslint:enable */

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
  syntaxHighlightInvoked = false;

  syntaxHighlight() {
    this.syntaxHighlightInvoked = true;
  }
}

describe( 'ResponseExplorerComponent', () => {
  let component: ResponseExplorerComponent;
  let fixture: ComponentFixture<ResponseExplorerComponent>;

  beforeEach( async( () => {
    TestBed.configureTestingModule( {
      declarations: [ResponseExplorerComponent],
      providers: [
        { provide: RequestService, useClass: RequestServiceMock },
        { provide: JsonHighlighterService, useClass: JsonHighlighterServiceMock }
      ]
    } )
      .compileComponents();
  } ) );

  beforeEach( () => {
    fixture = TestBed.createComponent( ResponseExplorerComponent );
    component = fixture.componentInstance;
    fixture.detectChanges();
  } );

  it( 'should create', () => {
    expect( component ).toBeTruthy();
  } );

  it( 'should subscribe to request service\'s response observable', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().inject( RequestService ) as any;

    expect( requestServiceMock.observableMock.hasSubscribed ).toBeTruthy();
  } );

  it( 'should syntax highlight json', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().inject( RequestService ) as any;
    const jsonHighlighterServiceMock: JsonHighlighterServiceMock = getTestBed().inject( JsonHighlighterService ) as any;

    requestServiceMock.observableMock.next( new HttpResponse( { body: { key: 'test' } } ) );

    expect( jsonHighlighterServiceMock.syntaxHighlightInvoked ).toBeTruthy();
  } );

  it( 'should not syntax highlight json when response body has no properties', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().inject( RequestService ) as any;
    const jsonHighlighterServiceMock: JsonHighlighterServiceMock = getTestBed().inject( JsonHighlighterService ) as any;

    requestServiceMock.observableMock.next( new HttpResponse( { body: {} } ) );

    expect( jsonHighlighterServiceMock.syntaxHighlightInvoked ).toBeFalsy();
  } );

  it( 'should parse empty response body', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().inject( RequestService ) as any;

    requestServiceMock.observableMock.next( new HttpResponse( { body: {} } ) );

    expect( component.showProperties ).toBeFalsy();
    expect( component.showLinks ).toBeFalsy();
    expect( component.showEmbedded ).toBeFalsy();
  } );

  it( 'should parse HAL response body', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().inject( RequestService ) as any;
    /* tslint:disable */
    const halResponse = {
      'text': 'hello all!',
      'timeStamp': '2018-06-02T17:12:07.335Z',
      '_links': {
        'self': {
          'href': 'https://chatty42.herokuapp.com/api/messages/1'
        },
        'chatty:chatMessage': {
          'href': 'https://chatty42.herokuapp.com/api/messages/1{?projection}',
          'templated': true
        },
        'curies': [
          {
            'href': 'https://chatty42.herokuapp.com/api/../docs/html5/{rel}.html',
            'name': 'chatty',
            'templated': true
          }
        ]
      },
      '_embedded': {
        'chatty:author': {
          'name': 'John'
        },
      }
    };
    /* tslint:enable */
    requestServiceMock.observableMock.next( new HttpResponse( { body: halResponse } ) );

    expect( component.showProperties ).toBeTruthy();
    expect( component.showLinks ).toBeTruthy();
    expect( component.showEmbedded ).toBeTruthy();
    expect( component.hasHalFormsTemplates ).toBeFalsy();
    expect( component.links.length ).toBe( 3 );
    expect( component.embedded.length ).toBe( 1 );
  } );

  it( 'should parse HAL-FORMS response body', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().inject( RequestService ) as any;

    const responseHeaders: HttpHeaders = new HttpHeaders(
      {
        'content-type': 'application/prs.hal-forms+json'
      } );
    requestServiceMock.observableMock.next( new HttpResponse( { headers: responseHeaders, body: halFormsResponse } ) );

    expect( component.showProperties ).toBeTruthy();
    expect( component.showLinks ).toBeTruthy();
    expect( component.showEmbedded ).toBeFalsy();
    expect( component.links.length ).toBe( 2 );
    expect( component.embedded.length ).toBe( 0 );
    expect( component.hasHalFormsTemplates ).toBeTruthy();
  } );

  it( 'should get HAL-FORMS link button class and state', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().inject( RequestService ) as any;

    const responseHeaders: HttpHeaders = new HttpHeaders(
      {
        'content-type': 'application/prs.hal-forms+json'
      } );
    requestServiceMock.observableMock.next( new HttpResponse( { headers: responseHeaders, body: halFormsResponse } ) );

    expect( component.getLinkButtonClass( 'self', Command.Get ) ).toBe( '' );
    expect( component.isButtonDisabled( 'self', Command.Get ) ).toBeFalsy();

    expect( component.getLinkButtonClass( 'self', Command.Post ) ).toBe( 'btn-outline-light' );
    expect( component.isButtonDisabled( 'self', Command.Post ) ).toBeTruthy();

    expect( component.getLinkButtonClass( 'self', Command.Put ) ).toBe( '' );
    expect( component.isButtonDisabled( 'self', Command.Put ) ).toBeFalsy();

    expect( component.getLinkButtonClass( 'self', Command.Patch ) ).toBe( '' );
    expect( component.isButtonDisabled( 'self', Command.Patch ) ).toBeFalsy();

    expect( component.getLinkButtonClass( 'self', Command.Delete ) ).toBe( '' );
    expect( component.isButtonDisabled( 'self', Command.Delete ) ).toBeFalsy();
  } );

  it( 'should invoke request service when processing command', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().inject( RequestService ) as any;

    component.processCommand( Command.Get, 'link' );

    expect( requestServiceMock.requestServiceProcessCommandInvoked ).toBeTruthy();
  } );

} );
