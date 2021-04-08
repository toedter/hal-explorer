import {HttpClient} from '@angular/common/http';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {AppService, RequestHeader} from '../app.service';
import {JsonHighlighterService} from '../json-highlighter/json-highlighter.service';
import {DictionaryObject, RequestComponent} from './request.component';
import {Command, EventType, HttpRequestEvent, RequestService} from './request.service';
import {Subject} from 'rxjs';

const jsonSchema: any = {
  title: 'User',
  properties: {
    fullName: {
      title: 'Full name',
      readOnly: false,
      type: 'string'
    },
    messages: {
      title: 'Messages',
      readOnly: true,
      type: 'string',
      format: 'uri'
    },
    id: {
      title: 'Id',
      readOnly: false,
      type: 'string'
    },
    email: {
      title: 'Email',
      readOnly: false,
      type: 'string'
    }
  },
  definitions: {},
  type: 'object',
  $schema: 'http://json-schema.org/draft-04/schema#'
};

const halFormsTemplates = {
  _templates: {
    default: {
      title: 'Change Movie',
      method: 'put',
      contentType: '',
      properties: [
        {
          name: 'title',
          prompt: 'Titel',
          required: true
        },
        {
          name: 'year',
          prompt: 'Jahr',
          required: true
        }
      ]
    },
    updateMoviePartially: {
      title: 'Change Movie (partially)',
      method: 'patch',
      contentType: '',
      properties: [
        {
          name: 'title',
          prompt: 'Titel',
          required: false
        },
        {
          name: 'year',
          prompt: 'Jahr',
          required: false
        }
      ]
    },
    deleteMovie: {
      title: 'Delete Movie',
      method: 'delete',
      contentType: '',
      properties: []
    },
    getDirectors: {
      title: 'Get Directors',
      method: 'GET',
      contentType: '',
      target: 'http://directors.com',
      properties: [
        {
          name: 'first-name',
          prompt: 'First Name',
        },
        {
          name: 'last-name',
          prompt: 'Last Name',
        }
      ]
    },
    getDirectorsWithInvalidMethod: {
      title: 'Get Directors',
      method: 'xxx',
      contentType: '',
      target: 'http://directors.com',
      properties: [
        {
          name: 'first-name',
          prompt: 'First Name',
        },
        {
          name: 'last-name',
          prompt: 'Last Name',
        }
      ]
    },
    withOptions: {
      title: 'Change Movie with Options',
      method: 'put',
      contentType: '',
      properties: [
        {
          name: 'title',
          prompt: 'Titel',
          required: true,
          options: {
            selectedValues: ['Movie 1', 'Movie 2']
          }
        }
      ]
    },
    withOptionsAndInline: {
      title: 'Change Movie with Options and Inline',
      method: 'put',
      contentType: '',
      properties: [
        {
          name: 'title',
          prompt: 'Titel',
          options: {
            inline: ['Movie 1', 'Movie 2']
          }
        }
      ]
    },
    withOptionsAndInlineAndRequired: {
      title: 'Change Movie with Options and Inline and Required',
      method: 'put',
      contentType: '',
      properties: [
        {
          name: 'title',
          prompt: 'Titel',
          required: true,
          options: {
            inline: ['Movie 1', 'Movie 2']
          }
        }
      ]
    }
  }
};

describe('RequestComponent', () => {
  let component: RequestComponent;
  let fixture: ComponentFixture<RequestComponent>;
  let requestServiceMock;
  let needInfoSubject;
  let responseSubject;
  let uriSubject;
  let requestHeaderSubject;
  let appServiceMock;

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
    appServiceMock = jasmine.createSpyObj(
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

    component.propertyChanged();
    expect(component.requestBody).toBe('{\n  "fullName": "Kai Toedter",\n  "email": "kai@toedter.com"\n}');
  });

  it('should get change request body based on HAL-FORMS template property with POST method', () => {
    component.halFormsTemplate = {value: halFormsTemplates._templates.default};
    component.halFormsProperties = component.halFormsTemplate.value.properties;
    component.halFormsProperties[0].value = 'Movie Title';
    component.halFormsProperties[1].value = '2019';

    component.propertyChanged();

    expect(component.requestBody).toBe('{\n  "title": "Movie Title",\n  "year": "2019"\n}');
  });

  it('should get change request URI based on HAL-FORMS template property with Get method', () => {
    component.halFormsTemplate = {value: halFormsTemplates._templates.getDirectors};
    component.halFormsProperties = component.halFormsTemplate.value.properties;
    component.halFormsProperties[0].value = 'George';
    component.halFormsProperties[1].value = 'Lucas';

    component.originalRequestUri = 'http://directors.com';
    component.propertyChanged();

    expect(component.newRequestUri).toBe('http://directors.com?first-name=George&last-name=Lucas');
  });

  it('should get change request URI based on HAL-FORMS template property with invalid method', () => {
    component.halFormsTemplate = {value: halFormsTemplates._templates.getDirectorsWithInvalidMethod};
    component.halFormsProperties = component.halFormsTemplate.value.properties;
    component.halFormsProperties[0].value = 'George';
    component.halFormsProperties[1].value = 'Lucas';

    component.originalRequestUri = 'http://directors.com';
    component.propertyChanged();

    expect(component.newRequestUri).toBe('http://directors.com?first-name=George&last-name=Lucas');
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
        },
        email: true
      }
    };
    const errorMessage: string = component.getValidationErrors(errors);
    const expectedResult = 'Value is required\n'
      + 'Value does not match pattern: \\d{3}$\n'
      + 'Value does not have required max length: 3\n'
      + 'Value does not have required min length: 1\n'
      + 'Value is bigger than max: 100\n'
      + 'Value is smaller than min: 1\n'
      + 'Value is not a valid email\n';
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

  it('should subscribe for uri changes', () => {
    uriSubject.next('http:://new-url.com');
    expect(requestServiceMock.getUri).toHaveBeenCalledWith('http:://new-url.com');
  });

  it('should subscribe for request header changes', () => {
    const requestHeaders = [new RequestHeader('a', 'b')];
    requestHeaderSubject.next(requestHeaders);
    expect(appServiceMock.setCustomRequestHeaders).toHaveBeenCalledWith(requestHeaders);
  });

  it('should create dictionary object', () => {
    const dictionaryObject = new DictionaryObject('prompt', 'value');
    expect(dictionaryObject.prompt).toBe('prompt');
    expect(dictionaryObject.value).toBe('value');
  });

  it('should get UI element for HAL-FORMS property', () => {
    let uiElement = component.getUiElementForHalFormsTemplateProperty({});
    expect(uiElement).toBe('input');

    uiElement = component.getUiElementForHalFormsTemplateProperty({options: {}});
    expect(uiElement).toBe('select');
  });

  it('should get HAL-FORMS options', () => {
    let options = component.getHalFormsOptions({});
    expect(options).toEqual([]);

    const noValueSelected = '<No Value Selected>';
    options = component.getHalFormsOptions({options: {}, required: false});
    expect(options[0].prompt).toBe(noValueSelected);
    expect(options[0].value).toBe(noValueSelected);

    options = component.getHalFormsOptions({options: {inline: ['a', 'b']}});
    expect(options[0].prompt).toBe(noValueSelected);
    expect(options[0].value).toBe(noValueSelected);
    expect(options[1].prompt).toBe('a');
    expect(options[1].value).toBe('a');
    expect(options[2].prompt).toBe('b');
    expect(options[2].value).toBe('b');

    options = component.getHalFormsOptions({options: {inline: [{prompt: 'a', value: 'x'}, {prompt: 'b', value: 'y'}]}});
    expect(options[0].prompt).toBe(noValueSelected);
    expect(options[0].value).toBe(noValueSelected);
    expect(options[1].prompt).toBe('a');
    expect(options[1].value).toBe('x');
    expect(options[2].prompt).toBe('b');
    expect(options[2].value).toBe('y');

    options = component.getHalFormsOptions({required: true, options: {inline: [{prompt: 'a', value: 'x'}, {prompt: 'b', value: 'y'}]}});
    expect(options[0].prompt).toBe('a');
    expect(options[0].value).toBe('x');
    expect(options[1].prompt).toBe('b');
    expect(options[1].value).toBe('y');
  });

  it('should return selected HAL-FORMS option', () => {
    let selected = component.isHalFormsOptionSelected({}, 'x');
    expect(selected).toBeFalse();

    selected = component.isHalFormsOptionSelected({value: ['x']}, 'x');
    expect(selected).toBeTrue();
  });

  it('should populate HAL-FORMS options value', () => {
    const halFormsTemplate = {
      key: 'withOptions',
      value: halFormsTemplates._templates.withOptions
    };

    const event: HttpRequestEvent =
      new HttpRequestEvent(EventType.FillHttpRequest, Command.Put, 'http://localhost/api/movies',
        undefined, halFormsTemplate);

    needInfoSubject.next(event);

    expect(component.halFormsTemplate).toEqual(halFormsTemplate);
    expect(component.halFormsPropertyKey).toEqual('Change Movie with Options');
    expect(component.halFormsProperties).toEqual(halFormsTemplate.value.properties);
    expect(component.halFormsProperties[0].value).toEqual(component.halFormsProperties[0].options.selectedValues);
  });

  it('should populate HAL-FORMS options value and inline', () => {
    const halFormsTemplate = {
      key: 'withOptionsAndInline',
      value: halFormsTemplates._templates.withOptionsAndInline
    };

    const event: HttpRequestEvent =
      new HttpRequestEvent(EventType.FillHttpRequest, Command.Put, 'http://localhost/api/movies',
        undefined, halFormsTemplate);

    needInfoSubject.next(event);

    expect(component.halFormsTemplate).toEqual(halFormsTemplate);
    expect(component.halFormsPropertyKey).toEqual('Change Movie with Options and Inline');
    expect(component.halFormsProperties).toEqual(halFormsTemplate.value.properties);
    expect(component.halFormsProperties[0].value).toEqual('<No Value Selected>');
  });

  it('should populate HAL-FORMS options value and inline and required', () => {
    const halFormsTemplate = {
      key: 'withOptionsAndInline',
      value: halFormsTemplates._templates.withOptionsAndInlineAndRequired
    };

    const event: HttpRequestEvent =
      new HttpRequestEvent(EventType.FillHttpRequest, Command.Put, 'http://localhost/api/movies',
        undefined, halFormsTemplate);

    needInfoSubject.next(event);

    expect(component.halFormsTemplate).toEqual(halFormsTemplate);
    expect(component.halFormsPropertyKey).toEqual('Change Movie with Options and Inline and Required');
    expect(component.halFormsProperties).toEqual(halFormsTemplate.value.properties);
    expect(component.halFormsProperties[0].value).toEqual('Movie 1');
  });

  it('should compute URI From Template when HAL-FORMS properties are available', () => {
    component.templatedUri = 'http://localhost/api/users{?page,size}';
    component.uriTemplateParameters = [];
    component.halFormsProperties = [];
    component.computeUriFromTemplate();

    expect(component.newRequestUri).toEqual('http://localhost/api/users');
  });

});
