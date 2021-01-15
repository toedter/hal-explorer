import { HttpClient } from '@angular/common/http';
import { ComponentFixture, getTestBed, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AppService, RequestHeader } from '../app.service';
import { JsonHighlighterService } from '../json-highlighter/json-highlighter.service';
import { RequestComponent } from './request.component';
import {
  Command,
  EventType,
  HttpRequestEvent,
  RequestService,
  UriTemplateEvent,
  UriTemplateParameter
} from './request.service';

class ObservableMock {
  private callback: (value: any) => void;
  hasSubscribed = false;

  subscribe(next?: (value: any) => void, error?: (error: any) => void) {
    this.callback = next;
    this.hasSubscribed = true;
  }

  next(input: any) {
    this.callback( input );
  }
}

class AppServiceMock {
  // tslint:disable-next-line:variable-name
  _uriObservable: ObservableMock = new ObservableMock();
  // tslint:disable-next-line:variable-name
  _requestHeadersObservable: ObservableMock = new ObservableMock();

  getUri(): string {
    return 'http://localhost/api';
  }

  getCustomRequestHeaders(): RequestHeader[] {
    return [];
  }

  setCustomRequestHeaders(requestHeaders: RequestHeader[]) {
  }

  get uriObservable(): ObservableMock {
    return this._uriObservable;
  }

  get requestHeadersObservable(): ObservableMock {
    return this._requestHeadersObservable;
  }

}

class RequestServiceMock {
  responseObservableMock: ObservableMock = new ObservableMock();
  needInfoObservableMock: ObservableMock = new ObservableMock();

  getUriCalledWith: string;
  requestUriCalled: boolean;

  getResponseObservable() {
    return this.responseObservableMock;
  }

  getNeedInfoObservable() {
    return this.needInfoObservableMock;
  }

  setCustomHeaders(requestHeaders: RequestHeader[]) {
  }

  getUri(uri: string) {
    this.getUriCalledWith = uri;
  }

  getInputType(jsonSchemaType: string, jsonSchemaFormat?: string): string {
    return 'number';
  }

  requestUri(uri: string, httpMethod: string, body?: string) {
    this.requestUriCalled = true;
  }
}

class JsonHighlighterServiceMock {
  syntaxHighlightInvoked = false;

  syntaxHighlight() {
    this.syntaxHighlightInvoked = true;
  }
}

/* tslint:disable */
const jsonSchema: any = {
  'title': 'User',
  'properties': {
    'fullName': {
      'title': 'Full name',
      'readOnly': false,
      'type': 'string'
    },
    'messages': {
      'title': 'Messages',
      'readOnly': true,
      'type': 'string',
      'format': 'uri'
    },
    'id': {
      'title': 'Id',
      'readOnly': false,
      'type': 'string'
    },
    'email': {
      'title': 'Email',
      'readOnly': false,
      'type': 'string'
    }
  },
  'definitions': {},
  'type': 'object',
  '$schema': 'http://json-schema.org/draft-04/schema#'
};

const halFormsTemplates = {
  '_templates': {
    'default': {
      'title': 'Change Movie',
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
      'title': 'Change Movie (partially)',
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
      'title': 'Delete Movie',
      'method': 'delete',
      'contentType': '',
      'properties': []
    }
  }
};
/* tslint:enable */

describe( 'RequestComponent', () => {
  let component: RequestComponent;
  let fixture: ComponentFixture<RequestComponent>;

  beforeEach( waitForAsync( () => {
    TestBed.configureTestingModule( {
      imports: [FormsModule],
      declarations: [RequestComponent],
      providers: [
        { provide: RequestService, useClass: RequestServiceMock },
        { provide: AppService, useClass: AppServiceMock },
        { provide: JsonHighlighterService, useClass: JsonHighlighterServiceMock },
        HttpClient
      ]

    } )
      .compileComponents();
  } ) );

  beforeEach( () => {
    fixture = TestBed.createComponent( RequestComponent );
    component = fixture.componentInstance;
    fixture.detectChanges();
  } );

  it( 'should create', () => {
    expect( component ).toBeTruthy();
  } );

  it( 'should fill uri template with query params', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().inject( RequestService ) as any;
    const uriTemplateParameters: UriTemplateParameter[] = [];
    uriTemplateParameters.push( new UriTemplateParameter( 'page', '0' ) );
    uriTemplateParameters.push( new UriTemplateParameter( 'size', '10' ) );
    const event: UriTemplateEvent = new UriTemplateEvent(
      EventType.FillUriTemplate, 'http://localhost/api/things{?page,size}', uriTemplateParameters );
    requestServiceMock.getNeedInfoObservable().next( event );
    expect( component.newRequestUri ).toBe( 'http://localhost/api/things?page=0&size=10' );
  } );

  it( 'should fill uri template with simple params', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().inject( RequestService ) as any;
    const uriTemplateParameters: UriTemplateParameter[] = [];
    uriTemplateParameters.push( new UriTemplateParameter( 'id', '1234' ) );
    const event: UriTemplateEvent = new UriTemplateEvent(
      EventType.FillUriTemplate, 'http://localhost/api/things/{id}', uriTemplateParameters );
    requestServiceMock.getNeedInfoObservable().next( event );
    expect( component.newRequestUri ).toBe( 'http://localhost/api/things/1234' );
  } );

  it( 'should fill http request', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().inject( RequestService ) as any;

    const uri = 'http://localhost/api/things';
    const event: HttpRequestEvent = new HttpRequestEvent( EventType.FillHttpRequest, Command.Post, uri );
    requestServiceMock.getNeedInfoObservable().next( event );
    expect( component.newRequestUri ).toBe( uri );
    expect( component.jsonSchema ).toBe( undefined );
  } );

  it( 'should fill http request with json schema', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().inject( RequestService ) as any;

    const event: HttpRequestEvent =
      new HttpRequestEvent( EventType.FillHttpRequest, Command.Post, 'http://localhost/api/things', jsonSchema );
    requestServiceMock.getNeedInfoObservable().next( event );
    expect( component.jsonSchema.toString ).toEqual( jsonSchema.toString );
  } );

  it( 'should fill http request with HAL-FORMS template properties', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().inject( RequestService ) as any;

    const event: HttpRequestEvent =
      new HttpRequestEvent( EventType.FillHttpRequest, Command.Put, 'http://localhost/api/movies',
        undefined, halFormsTemplates._templates );

    requestServiceMock.getNeedInfoObservable().next( event );

    expect( component.halFormsTemplates.toString ).toEqual( halFormsTemplates.toString );
    expect( component.halFormsDialogTitle ).toEqual( 'Change Movie' );
    expect( component.halFormsProperties.toString ).toEqual( halFormsTemplates._templates.default.properties.toString );
  } );

  it( 'should support HTTP method with HAL-FORMS', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().inject( RequestService ) as any;

    const event: HttpRequestEvent =
      new HttpRequestEvent( EventType.FillHttpRequest, Command.Put, 'http://localhost/api/movies',
        undefined, halFormsTemplates._templates );

    requestServiceMock.getNeedInfoObservable().next( event );

    expect( component.supportsHttpMethod( Command.Put ) ).toBeTruthy();
    expect( component.supportsHttpMethod( Command.Patch ) ).toBeFalsy();
    expect( component.supportsHttpMethod( Command.Delete ) ).toBeFalsy();
    expect( component.supportsHttpMethod( Command.Post ) ).toBeFalsy();
  } );

  it( 'should get expanded uri', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().inject( RequestService ) as any;
    component.newRequestUri = 'http://localhost';

    component.getExpandedUri();
    expect( requestServiceMock.getUriCalledWith ).toBe( 'http://localhost' );
  } );

  it( 'should get change request body based on json schema', () => {
    component.jsonSchema = jsonSchema.properties;
    component.jsonSchema.email.value = 'kai@toedter.com';
    component.jsonSchema.fullName.value = 'Kai Toedter';

    component.requestBodyChanged();
    expect( component.requestBody ).toBe( '{\n  "fullName": "Kai Toedter",\n  "email": "kai@toedter.com"\n}' );
  } );

  it( 'should get change request body based on HAL-FORMS', () => {
    component.halFormsTemplates = halFormsTemplates;
    component.halFormsProperties = halFormsTemplates._templates.default.properties;
    component.halFormsProperties[0].value = 'Movie Title';
    component.halFormsProperties[1].value = '2019';

    component.requestBodyChanged();

    expect( component.requestBody ).toBe( '{\n  "title": "Movie Title",\n  "year": "2019"\n}' );
  } );

  it( 'should get tooltip with no json schema', () => {
    const tooltip = component.getTooltip( 'x' );
    expect( tooltip ).toBe( '' );
  } );

  it( 'should get tooltip with json schema', () => {
    component.jsonSchema = jsonSchema.properties;
    const tooltip = component.getTooltip( 'email' );
    expect( tooltip ).toBe( 'string' );
  } );

  it( 'should get tooltip with json schema with format attribute', () => {
    component.jsonSchema = jsonSchema.properties;
    const tooltip = component.getTooltip( 'messages' );
    expect( tooltip ).toBe( 'string in uri format' );
  } );

  it( 'should go from hash change', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().inject( RequestService ) as any;
    component.newRequestUri = 'http://localhost';

    component.goFromHashChange( 'http://localhost' );
    expect( requestServiceMock.getUriCalledWith ).toBe( 'http://localhost' );
  } );

  it( 'should get all validation errors', () => {
    const errors = {
      errors: {
        required: true,
        pattern: {
          requiredPattern: '\\d{3}$'
        },
        maxlength: {
          requiredLength: 3
        },
        minlength: {
          requiredLength: 1
        },
        max: {
          max: 100
        },
        min: {
          min: 1
        }
      }
    };
    const errorMessage: string = component.getValidationErrors( errors );
    const expectedResult = 'Value is required\n'
      + 'Value does not match pattern: \\d{3}$\n'
      + 'Value does not have required max length: 3\n'
      + 'Value does not have required min length: 1\n'
      + 'Value is bigger than max: 100\n'
      + 'Value is smaller than min: 1\n';
    expect( errorMessage ).toBe( expectedResult );
  } );

  it( 'should get no validation errors', () => {
    const errors = {};
    const errorMessage: string = component.getValidationErrors( errors );
    expect( errorMessage ).toBe( '' );
  } );

  it( 'should get no validation errors', () => {
    const errors = {
      errors: {}
    };
    const errorMessage: string = component.getValidationErrors( errors );
    const expectedResult = '';
    expect( errorMessage ).toBe( expectedResult );
  } );

  it( 'should update request headers', () => {
    const requestHeader: RequestHeader = new RequestHeader( 'key', 'value' );
    component.tempRequestHeaders = [requestHeader];
    component.updateRequestHeaders();
    expect( component.requestHeaders ).toEqual( component.tempRequestHeaders );
  } );

  it( 'should update temp request headers', () => {
    const requestHeader: RequestHeader = new RequestHeader( 'key', 'value' );
    const emptyRequestHeader: RequestHeader = new RequestHeader( '', '' );
    component.requestHeaders = [requestHeader];
    component.showEditHeadersDialog();
    expect( component.tempRequestHeaders[0] ).toEqual( requestHeader );
    expect( component.tempRequestHeaders[1] ).toEqual( emptyRequestHeader );
    expect( component.tempRequestHeaders[2] ).toEqual( emptyRequestHeader );
    expect( component.tempRequestHeaders[3] ).toEqual( emptyRequestHeader );
    expect( component.tempRequestHeaders[4] ).toEqual( emptyRequestHeader );
  } );

  it( 'should get undefined HAL-FORMS properties', () => {
    const halFormsProperties = component.getHalFormsPropertiesForHttpMethod( null );
    expect( halFormsProperties ).toBeUndefined();
  } );

  it( 'should get undefined HAL-FORMS title', () => {
    const halFormsTitle = component.getHalFormsTitleForHttpMethod( null );
    expect( halFormsTitle ).toBeUndefined();
  } );

  it( 'should get JSON Schema input type', () => {
    component.jsonSchema = {
      test: {
        type: 'integer'
      }
    };

    const inputType = component.getInputType( 'test' );
    expect( inputType ).toBe( 'number' );
  } );

  it( 'should create or update resource', () => {
    const requestServiceMock: RequestServiceMock = getTestBed().inject( RequestService ) as any;

    component.createOrUpdateResource();
    expect(requestServiceMock.requestUriCalled).toBeTrue();
  } );

} );
