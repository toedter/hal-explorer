import {HttpClient} from '@angular/common/http';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {AppService, RequestHeader} from '../app.service';
import {JsonHighlighterService} from '../json-highlighter/json-highlighter.service';
import {RequestComponent} from './request.component';
import {Command, EventType, HttpRequestEvent, RequestService} from './request.service';
import {Subject} from 'rxjs';

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

describe('RequestComponent', () => {
  let component: RequestComponent;
  let fixture: ComponentFixture<RequestComponent>;
  let requestServiceMock;
  let needInfoSubject;
  let responseSubject;
  let uriSubject;
  let requestHeaderSubject;

  beforeEach(waitForAsync(() => {
    requestServiceMock = jasmine.createSpyObj(
      ['getResponseObservable', 'getNeedInfoObservable', 'setCustomHeaders', 'getUri', 'getInputType', 'requestUri']);
    needInfoSubject = new Subject<string>();
    responseSubject = new Subject<string>();
    requestServiceMock.getResponseObservable.and.returnValue(responseSubject);
    requestServiceMock.getNeedInfoObservable.and.returnValue(needInfoSubject);
    requestServiceMock.getUri.and.returnValue('http://localhost/api');
    requestServiceMock.getInputType.and.returnValue('number');

    uriSubject = new Subject<string>();
    requestHeaderSubject = new Subject<RequestHeader[]>();
    const appServiceMock = jasmine.createSpyObj(
      ['getUri', 'getCustomRequestHeaders', 'setCustomRequestHeaders'],
      {uriObservable: uriSubject, requestHeadersObservable: requestHeaderSubject});
    appServiceMock.getUri.and.returnValue('http://localhost/api');
    appServiceMock.getCustomRequestHeaders.and.returnValue([]);
    const jsonHighlighterServiceMock = jasmine.createSpyObj(['syntaxHighlight']);

    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [RequestComponent],
      providers: [
        {provide: RequestService, useValue: requestServiceMock},
        {provide: AppService, useValue: appServiceMock},
        {provide: JsonHighlighterService, useValue: jsonHighlighterServiceMock},
        HttpClient
      ]

    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fill uri template with query params', () => {
    const event: HttpRequestEvent = new HttpRequestEvent(
      EventType.FillHttpRequest, Command.Get, 'http://localhost/api/things{?page,size}');
    needInfoSubject.next(event);
    component.uriTemplateParameters[0].value = '0';
    component.uriTemplateParameters[1].value = '10';
    component.computeUriFromTemplate();
    expect(component.newRequestUri).toBe('http://localhost/api/things?page=0&size=10');
  });

  it('should fill uri template with simple params', () => {
    const event: HttpRequestEvent = new HttpRequestEvent(
      EventType.FillHttpRequest, Command.Get, 'http://localhost/api/things/{id}');
    needInfoSubject.next(event);
    component.uriTemplateParameters[0].value = '1234';
    component.computeUriFromTemplate();
    expect(component.newRequestUri).toBe('http://localhost/api/things/1234');
  });

  it('should fill http request', () => {
    const uri = 'http://localhost/api/things';
    const event: HttpRequestEvent = new HttpRequestEvent(EventType.FillHttpRequest, Command.Post, uri);
    needInfoSubject.next(event);
    expect(component.newRequestUri).toBe(uri);
    expect(component.jsonSchema).toBe(undefined);
  });

  it('should fill http request with json schema', () => {
    const event: HttpRequestEvent =
      new HttpRequestEvent(EventType.FillHttpRequest, Command.Post, 'http://localhost/api/things', jsonSchema);
    needInfoSubject.next(event);
    expect(component.jsonSchema.toString).toEqual(jsonSchema.toString);
  });

  it('should fill http request with HAL-FORMS template properties', () => {
    const halFormsTemplate = {
      key: 'default',
      value: halFormsTemplates._templates.default
    };

    const event: HttpRequestEvent =
      new HttpRequestEvent(EventType.FillHttpRequest, Command.Put, 'http://localhost/api/movies',
        undefined, halFormsTemplate);

    needInfoSubject.next(event);

    expect(component.halFormsTemplate).toEqual(halFormsTemplate);
    expect(component.halFormsPropertyKey).toEqual('Change Movie');
    expect(component.halFormsProperties).toEqual(halFormsTemplate.value.properties);
  });

  it('should get expanded uri', () => {
    component.newRequestUri = 'http://localhost';

    component.getExpandedUri();
    expect(requestServiceMock.getUri).toHaveBeenCalledWith('http://localhost');
  });

  it('should get change request body based on json schema', () => {
    component.jsonSchema = jsonSchema.properties;
    component.jsonSchema.email.value = 'kai@toedter.com';
    component.jsonSchema.fullName.value = 'Kai Toedter';

    component.halFormsPropertyChanged();
    expect(component.requestBody).toBe('{\n  "fullName": "Kai Toedter",\n  "email": "kai@toedter.com"\n}');
  });

  it('should get change request body based on HAL-FORMS', () => {
    component.halFormsTemplate = {value: halFormsTemplates._templates.default};
    component.halFormsProperties = component.halFormsTemplate.value.properties;
    component.halFormsProperties[0].value = 'Movie Title';
    component.halFormsProperties[1].value = '2019';

    component.halFormsPropertyChanged();

    expect(component.requestBody).toBe('{\n  "title": "Movie Title",\n  "year": "2019"\n}');
  });

  it('should get tooltip with no json schema', () => {
    const tooltip = component.getTooltip('x');
    expect(tooltip).toBe('');
  });

  it('should get tooltip with json schema', () => {
    component.jsonSchema = jsonSchema.properties;
    const tooltip = component.getTooltip('email');
    expect(tooltip).toBe('string');
  });

  it('should get tooltip with json schema with format attribute', () => {
    component.jsonSchema = jsonSchema.properties;
    const tooltip = component.getTooltip('messages');
    expect(tooltip).toBe('string in uri format');
  });

  it('should go from hash change', () => {
    component.newRequestUri = 'http://localhost';

    component.goFromHashChange('http://localhost');
    expect(requestServiceMock.getUri).toHaveBeenCalledWith('http://localhost');
  });

  it('should get all validation errors', () => {
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
    const errorMessage: string = component.getValidationErrors(errors);
    const expectedResult = 'Value is required\n'
      + 'Value does not match pattern: \\d{3}$\n'
      + 'Value does not have required max length: 3\n'
      + 'Value does not have required min length: 1\n'
      + 'Value is bigger than max: 100\n'
      + 'Value is smaller than min: 1\n';
    expect(errorMessage).toBe(expectedResult);
  });

  it('should get no validation errors', () => {
    const errors = {};
    const errorMessage: string = component.getValidationErrors(errors);
    expect(errorMessage).toBe('');
  });

  it('should get no validation errors', () => {
    const errors = {
      errors: {}
    };
    const errorMessage: string = component.getValidationErrors(errors);
    const expectedResult = '';
    expect(errorMessage).toBe(expectedResult);
  });

  it('should update request headers', () => {
    const requestHeader: RequestHeader = new RequestHeader('key', 'value');
    component.tempRequestHeaders = [requestHeader];
    component.updateRequestHeaders();
    expect(component.requestHeaders).toEqual(component.tempRequestHeaders);
  });

  it('should update temp request headers', () => {
    const requestHeader: RequestHeader = new RequestHeader('key', 'value');
    const emptyRequestHeader: RequestHeader = new RequestHeader('', '');
    component.requestHeaders = [requestHeader];
    component.showEditHeadersDialog();
    expect(component.tempRequestHeaders[0]).toEqual(requestHeader);
    expect(component.tempRequestHeaders[1]).toEqual(emptyRequestHeader);
    expect(component.tempRequestHeaders[2]).toEqual(emptyRequestHeader);
    expect(component.tempRequestHeaders[3]).toEqual(emptyRequestHeader);
    expect(component.tempRequestHeaders[4]).toEqual(emptyRequestHeader);
  });

  it('should get JSON Schema input type', () => {
    component.jsonSchema = {
      test: {
        type: 'integer'
      }
    };

    const inputType = component.getInputType('test');
    expect(inputType).toBe('number');
  });

  it('should make HTTP request', () => {
    component.makeHttpRequest();
    expect(requestServiceMock.requestUri).toHaveBeenCalled();
  });

});
