import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AppService, RequestHeader } from '../app.service';
import { JsonHighlighterService } from '../json-highlighter/json-highlighter.service';
import { DictionaryObject, RequestComponent } from './request.component';
import { Command, EventType, HttpRequestEvent, RequestService } from './request.service';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const jsonSchema: any = {
  title: 'User',
  properties: {
    fullName: {
      title: 'Full name',
      readOnly: false,
      type: 'string',
    },
    messages: {
      title: 'Messages',
      readOnly: true,
      type: 'string',
      format: 'uri',
    },
    id: {
      title: 'Id',
      readOnly: false,
      type: 'string',
    },
    email: {
      title: 'Email',
      readOnly: false,
      type: 'string',
    },
  },
  definitions: {},
  type: 'object',
  $schema: 'http://json-schema.org/draft-04/schema#',
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
          required: true,
        },
        {
          name: 'year',
          prompt: 'Jahr',
          required: true,
        },
      ],
    },
    updateMoviePartially: {
      title: 'Change Movie (partially)',
      method: 'patch',
      contentType: '',
      properties: [
        {
          name: 'title',
          prompt: 'Titel',
          required: false,
        },
        {
          name: 'year',
          prompt: 'Jahr',
          required: false,
        },
      ],
    },
    deleteMovie: {
      title: 'Delete Movie',
      method: 'delete',
      contentType: '',
      properties: [],
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
        },
      ],
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
        },
      ],
    },
    withOptionsAndNoInline: {
      title: 'Change Movie with Options',
      method: 'put',
      contentType: '',
      properties: [
        {
          name: 'title',
          prompt: 'Titel',
          required: true,
          options: {
            selectedValues: ['Movie 1', 'Movie 2'],
          },
          maxItems: 1,
        },
      ],
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
            selectedValues: ['Movie 1'],
            inline: ['Movie 1', 'Movie 2'],
            maxItems: 1,
          },
        },
      ],
    },
    withOptionsAndInlineAndNoSelectedValues: {
      title: 'Change Movie with Options and Inline and no selected values',
      method: 'put',
      contentType: '',
      properties: [
        {
          name: 'title',
          prompt: 'Titel',
          options: {
            inline: ['Movie 1', 'Movie 2'],
            maxItems: 1,
          },
        },
      ],
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
            inline: ['Movie 1', 'Movie 2'],
            maxItems: 1,
          },
        },
      ],
    },
    withOptionsAndLink: {
      title: 'Change Movie with Options and Link',
      method: 'put',
      contentType: '',
      properties: [
        {
          name: 'title',
          prompt: 'Titel',
          required: true,
          options: {
            link: {
              href: 'http://options.com',
            },
            maxItems: 1,
          },
        },
      ],
    },
    withMultipleOptions: {
      title: 'Change Movie with multiple Options',
      method: 'put',
      contentType: '',
      properties: [
        {
          name: 'title',
          prompt: 'Titel',
          required: true,
          options: {
            selectedValues: ['Movie 1', 'Movie 2'],
            inline: ['Movie 1', 'Movie 2'],
            maxItems: 2,
          },
        },
      ],
    },
    withMultipleOptionsAndNoSelectedValues: {
      title: 'Change Movie with multiple Options and no selected values',
      method: 'put',
      contentType: '',
      properties: [
        {
          name: 'title',
          prompt: 'Titel',
          required: true,
          options: {
            inline: ['Movie 1', 'Movie 2'],
            maxItems: 2,
          },
        },
      ],
    },
    withOptionsAndMalformedInline: {
      title: 'Change Movie with Options and malformed Inline',
      method: 'put',
      contentType: '',
      properties: [
        {
          name: 'title',
          prompt: 'Titel',
          options: {
            inline: { _embedded: ['Movie 1', 'Movie 2'] },
            maxItems: 1,
          },
        },
      ],
    },
    withOptionsAndMalformedInline2: {
      title: 'Change Movie with Options and malformed Inline (',
      method: 'put',
      contentType: '',
      properties: [
        {
          name: 'title',
          prompt: 'Titel',
          options: {
            inline: [{ key: 'malformed' }],
          },
          maxItems: 1,
        },
      ],
    },
    withNoProperties: {
      title: 'Clear all items',
      method: 'POST',
      contentType: 'application/json',
      target: '/api/carts/2e769b7c-2fff-4830-9beb-737c3a4a65e9/clear',
    },
  },
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

  beforeEach(async () => {
    requestServiceMock = {
      getResponseObservable: vi.fn(),
      getNeedInfoObservable: vi.fn(),
      getLoadingObservable: vi.fn(),
      setCustomHeaders: vi.fn(),
      getUri: vi.fn(),
      getInputType: vi.fn(),
      requestUri: vi.fn(),
      computeHalFormsOptionsFromLink: vi.fn(),
    };
    needInfoSubject = new Subject<string>();
    responseSubject = new Subject<string>();
    requestServiceMock.getResponseObservable.mockReturnValue(responseSubject);
    requestServiceMock.getNeedInfoObservable.mockReturnValue(needInfoSubject);
    requestServiceMock.getLoadingObservable.mockReturnValue(new Subject<boolean>());
    requestServiceMock.getUri.mockReturnValue('http://localhost/api');
    requestServiceMock.getInputType.mockReturnValue('number');
    requestServiceMock.computeHalFormsOptionsFromLink.mockImplementation(property => {
      property.options.inline = ['a', 'b'];
    });

    uriSubject = new Subject<string>();
    requestHeaderSubject = new Subject<RequestHeader[]>();
    appServiceMock = {
      getUri: vi.fn(),
      getCustomRequestHeaders: vi.fn(),
      setCustomRequestHeaders: vi.fn(),
      isFromBrowserNavigation: vi.fn(),
      uriObservable: uriSubject,
      requestHeadersObservable: requestHeaderSubject,
    };
    appServiceMock.getUri.mockReturnValue('http://localhost/api');
    appServiceMock.getCustomRequestHeaders.mockReturnValue([]);
    appServiceMock.isFromBrowserNavigation.mockReturnValue(true); // Default to true for back/forward navigation

    const jsonHighlighterServiceMock = {
      syntaxHighlight: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [FormsModule, RequestComponent],
      providers: [
        { provide: RequestService, useValue: requestServiceMock },
        { provide: AppService, useValue: appServiceMock },
        { provide: JsonHighlighterService, useValue: jsonHighlighterServiceMock },
        HttpClient,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fill uri template with query params', () => {
    const event: HttpRequestEvent = new HttpRequestEvent(
      EventType.FillHttpRequest,
      Command.Get,
      'http://localhost/api/things{?page,size}'
    );
    needInfoSubject.next(event);
    component.uriTemplateParameters[0].value = '0';
    component.uriTemplateParameters[1].value = '10';
    component.computeUriFromTemplate();
    expect(component.newRequestUri).toBe('http://localhost/api/things?page=0&size=10');
  });

  it('should fill uri template with simple params', () => {
    const event: HttpRequestEvent = new HttpRequestEvent(
      EventType.FillHttpRequest,
      Command.Get,
      'http://localhost/api/things/{id}'
    );
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
    const event: HttpRequestEvent = new HttpRequestEvent(
      EventType.FillHttpRequest,
      Command.Post,
      'http://localhost/api/things',
      jsonSchema
    );
    needInfoSubject.next(event);
    expect(component.jsonSchema.toString).toEqual(jsonSchema.toString);
  });

  it('should fill http request with HAL-FORMS template properties', () => {
    const halFormsTemplate = {
      key: 'default',
      value: halFormsTemplates._templates.default,
    };

    const event: HttpRequestEvent = new HttpRequestEvent(
      EventType.FillHttpRequest,
      Command.Put,
      'http://localhost/api/movies',
      undefined,
      halFormsTemplate
    );

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
    component.halFormsTemplate = { value: halFormsTemplates._templates.default };
    component.halFormsProperties = component.halFormsTemplate.value.properties;
    component.halFormsProperties[0].value = 'Movie Title';
    component.halFormsProperties[1].value = '2019';

    component.propertyChanged();

    expect(component.requestBody).toBe('{\n  "title": "Movie Title",\n  "year": "2019"\n}');
  });

  it('should get change request URI based on HAL-FORMS template property with Get method', () => {
    component.halFormsTemplate = { value: halFormsTemplates._templates.getDirectors };
    component.halFormsProperties = component.halFormsTemplate.value.properties;
    component.halFormsProperties[0].value = 'George';
    component.halFormsProperties[1].value = 'Lucas';

    component.originalRequestUri = 'http://directors.com';
    component.propertyChanged();

    expect(component.newRequestUri).toBe('http://directors.com?first-name=George&last-name=Lucas');
  });

  it('should get change request URI based on HAL-FORMS template property with invalid method', () => {
    component.halFormsTemplate = { value: halFormsTemplates._templates.getDirectorsWithInvalidMethod };
    component.halFormsProperties = component.halFormsTemplate.value.properties;
    component.halFormsProperties[0].value = 'George';
    component.halFormsProperties[1].value = 'Lucas';

    component.originalRequestUri = 'http://directors.com';
    component.propertyChanged();

    expect(component.newRequestUri).toBe('http://directors.com?first-name=George&last-name=Lucas');
  });

  it('should get change request URI with multiple selected values for same parameter', () => {
    // Test case for multiple values (e.g., sort parameter with multiple sort orders)
    component.halFormsTemplate = {
      value: {
        method: 'GET',
        properties: [
          {
            name: 'sort',
            options: {
              maxItems: 5, // Multiple values allowed
              inline: ['name,asc', 'id,desc', 'date,asc'],
            },
          },
        ],
      },
    };
    component.halFormsProperties = component.halFormsTemplate.value.properties;
    component.halFormsProperties[0].value = ['name,asc', 'id,desc'];

    component.originalRequestUri = 'http://api.com/items';
    component.propertyChanged();

    // Should repeat parameter name for each value (comma is encoded as %2C)
    expect(component.newRequestUri).toBe('http://api.com/items?sort=name%2Casc&sort=id%2Cdesc');
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
          requiredPattern: '\\d{3}$',
        },
        maxlength: {
          requiredLength: 3,
        },
        minlength: {
          requiredLength: 1,
        },
        max: {
          max: 100,
        },
        min: {
          min: 1,
        },
        email: true,
        maxItems: {
          maxItems: 2,
        },
        minItems: {
          minItems: 1,
        },
      },
    };
    const errorMessage: string = component.getValidationErrors(errors);
    const expectedResult =
      'Value is required\n' +
      'Value does not match pattern: \\d{3}$\n' +
      'Value does not have required max length: 3\n' +
      'Value does not have required min length: 1\n' +
      'Value is bigger than max: 100\n' +
      'Value is smaller than min: 1\n' +
      'Value is not a valid email\n' +
      'Selection exceeds the maximum number of items: 2\n' +
      'Selection falls below the minimum number of items: 1\n';
    expect(errorMessage).toBe(expectedResult);
  });

  it('should get no validation errors', () => {
    const errors = {};
    const errorMessage: string = component.getValidationErrors(errors);
    expect(errorMessage).toBe('');
  });

  it('should get no validation errors', () => {
    const errors = {
      errors: {},
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
        type: 'integer',
      },
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

  it('should handle modal keydown with Enter key and valid form', () => {
    const mockButton = { click: vi.fn() };
    vi.spyOn(document, 'getElementById').mockReturnValue(mockButton as any);

    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    const form = { valid: true };
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    component.handleModalKeydown(event, form);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(mockButton.click).toHaveBeenCalled();
  });

  it('should not submit modal on Enter key with invalid form', () => {
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    const form = { valid: false };
    const goButton = document.createElement('button');
    goButton.id = 'requestDialogGoButton';
    document.body.appendChild(goButton);

    vi.spyOn(event, 'preventDefault');
    vi.spyOn(goButton, 'click');

    component.handleModalKeydown(event, form);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(goButton.click).not.toHaveBeenCalled();

    document.body.removeChild(goButton);
  });

  it('should handle modal keydown with non-Enter key', () => {
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    const form = { valid: true };

    vi.spyOn(event, 'preventDefault');

    component.handleModalKeydown(event, form);

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('should subscribe to loading observable', () => {
    const loadingSubject = new Subject<boolean>();
    requestServiceMock.getLoadingObservable.mockReturnValue(loadingSubject);

    // Create new component to trigger ngOnInit
    const newFixture = TestBed.createComponent(RequestComponent);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();

    expect(newComponent.isLoading).toBe(false);

    loadingSubject.next(true);
    expect(newComponent.isLoading).toBe(true);

    loadingSubject.next(false);
    expect(newComponent.isLoading).toBe(false);
  });

  it('should get UI element for HAL-FORMS property', () => {
    let uiElement = component.getUiElementForHalFormsTemplateProperty({});
    expect(uiElement).toBe('input');

    uiElement = component.getUiElementForHalFormsTemplateProperty({ options: {} });
    expect(uiElement).toBe('select');
  });

  it('should get HAL-FORMS options (single option)', () => {
    let options = component.getHalFormsOptions({});
    expect(options).toEqual([]);

    const noValueSelected = '<No Value Selected>';
    options = component.getHalFormsOptions({
      options: {
        maxItems: 1,
      },
      required: false,
    });
    expect(options[0].prompt).toBe(noValueSelected);
    expect(options[0].value).toBe(noValueSelected);

    options = component.getHalFormsOptions({
      options: {
        inline: ['a', 'b'],
        maxItems: 1,
      },
    });
    expect(options[0].prompt).toBe(noValueSelected);
    expect(options[0].value).toBe(noValueSelected);
    expect(options[1].prompt).toBe('a');
    expect(options[1].value).toBe('a');
    expect(options[2].prompt).toBe('b');
    expect(options[2].value).toBe('b');

    options = component.getHalFormsOptions({
      options: {
        inline: [
          {
            prompt: 'a',
            value: 'x',
          },
          {
            prompt: 'b',
            value: 'y',
          },
        ],
        maxItems: 1,
      },
    });
    expect(options[0].prompt).toBe(noValueSelected);
    expect(options[0].value).toBe(noValueSelected);
    expect(options[1].prompt).toBe('a');
    expect(options[1].value).toBe('x');
    expect(options[2].prompt).toBe('b');
    expect(options[2].value).toBe('y');
  });

  it('should get HAL-FORMS options (multiple options)', () => {
    let options = component.getHalFormsOptions({});
    expect(options).toEqual([]);

    options = component.getHalFormsOptions({
      options: {},
      required: false,
    });
    expect(options).toEqual([]);

    options = component.getHalFormsOptions({
      options: {
        inline: ['a', 'b'],
      },
    });
    expect(options[0].prompt).toBe('a');
    expect(options[0].value).toBe('a');
    expect(options[1].prompt).toBe('b');
    expect(options[1].value).toBe('b');

    options = component.getHalFormsOptions({
      options: {
        inline: [
          {
            prompt: 'a',
            value: 'x',
          },
          {
            prompt: 'b',
            value: 'y',
          },
        ],
      },
    });
    expect(options[0].prompt).toBe('a');
    expect(options[0].value).toBe('x');
    expect(options[1].prompt).toBe('b');
    expect(options[1].value).toBe('y');

    options = component.getHalFormsOptions({
      required: true,
      options: {
        inline: [
          {
            prompt: 'a',
            value: 'x',
          },
          {
            prompt: 'b',
            value: 'y',
          },
        ],
      },
    });
    expect(options[0].prompt).toBe('a');
    expect(options[0].value).toBe('x');
    expect(options[1].prompt).toBe('b');
    expect(options[1].value).toBe('y');
  });

  it('should return selected HAL-FORMS option', () => {
    let selected = component.isHalFormsOptionSelected({}, 'x');
    expect(selected).toBe(false);

    selected = component.isHalFormsOptionSelected({ value: ['x'] }, 'x');
    expect(selected).toBe(true);
  });

  it('should ignore HAL-FORMS options with no inline', () => {
    const halFormsTemplate = {
      key: 'withOptionsAndNoInline',
      value: halFormsTemplates._templates.withOptionsAndNoInline,
    };

    const event: HttpRequestEvent = new HttpRequestEvent(
      EventType.FillHttpRequest,
      Command.Put,
      'http://localhost/api/movies',
      undefined,
      halFormsTemplate
    );

    needInfoSubject.next(event);

    expect(component.halFormsTemplate).toEqual(halFormsTemplate);
    expect(component.halFormsProperties[0].options).toBeUndefined();
  });

  it('should populate HAL-FORMS options value and inline', () => {
    const halFormsTemplate = {
      key: 'withOptionsAndInline',
      value: halFormsTemplates._templates.withOptionsAndInline,
    };

    const event: HttpRequestEvent = new HttpRequestEvent(
      EventType.FillHttpRequest,
      Command.Put,
      'http://localhost/api/movies',
      undefined,
      halFormsTemplate
    );

    needInfoSubject.next(event);

    expect(component.halFormsTemplate).toEqual(halFormsTemplate);
    expect(component.halFormsPropertyKey).toEqual('Change Movie with Options and Inline');
    expect(component.halFormsProperties).toEqual(halFormsTemplate.value.properties);
    expect(component.halFormsProperties[0].value).toEqual('Movie 1');
  });

  it('should populate HAL-FORMS options value and inline and no selected values', () => {
    const halFormsTemplate = {
      key: 'withOptionsAndInlineAndNoSelectedValues',
      value: halFormsTemplates._templates.withOptionsAndInlineAndNoSelectedValues,
    };

    const event: HttpRequestEvent = new HttpRequestEvent(
      EventType.FillHttpRequest,
      Command.Put,
      'http://localhost/api/movies',
      undefined,
      halFormsTemplate
    );

    needInfoSubject.next(event);

    expect(component.halFormsTemplate).toEqual(halFormsTemplate);
    expect(component.halFormsPropertyKey).toEqual('Change Movie with Options and Inline and no selected values');
    expect(component.halFormsProperties).toEqual(halFormsTemplate.value.properties);
    expect(component.halFormsProperties[0].value).toEqual(component.noValueSelected);
  });

  it('should populate HAL-FORMS options value and inline and required', () => {
    const halFormsTemplate = {
      key: 'withOptionsAndInlineAndRequired',
      value: halFormsTemplates._templates.withOptionsAndInlineAndRequired,
    };

    const event: HttpRequestEvent = new HttpRequestEvent(
      EventType.FillHttpRequest,
      Command.Put,
      'http://localhost/api/movies',
      undefined,
      halFormsTemplate
    );

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

  it('should compute HAL-FORMS options from options.link', () => {
    const halFormsTemplate = {
      key: 'withOptionsAndLink',
      value: halFormsTemplates._templates.withOptionsAndLink,
    };

    const event: HttpRequestEvent = new HttpRequestEvent(
      EventType.FillHttpRequest,
      Command.Put,
      'http://localhost/api/movies',
      undefined,
      halFormsTemplate
    );

    needInfoSubject.next(event);

    expect(
      (halFormsTemplates._templates.withOptionsAndLink.properties[0].options as any).computedOptions[0].prompt
    ).toEqual('a');
  });

  it('should not compute HAL-FORMS options from options.link', () => {
    const halFormsTemplate = {
      key: 'withOptionsAndLink',
      value: halFormsTemplates._templates.withOptionsAndLink,
    };
    (halFormsTemplates._templates.withOptionsAndLink.properties[0].options as any).inline = undefined;

    const event: HttpRequestEvent = new HttpRequestEvent(
      EventType.FillHttpRequest,
      Command.Put,
      'http://localhost/api/movies',
      undefined,
      halFormsTemplate
    );

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    requestServiceMock.computeHalFormsOptionsFromLink.mockImplementation(() => {});
    needInfoSubject.next(event);

    expect((halFormsTemplates._templates.withOptionsAndLink.properties[0].options as any).inline).toBeUndefined();
  });

  it('should compute HAL-FORMS with multiple options', () => {
    const halFormsTemplate = {
      key: 'withMultipleOptions',
      value: halFormsTemplates._templates.withMultipleOptions,
    };

    const event: HttpRequestEvent = new HttpRequestEvent(
      EventType.FillHttpRequest,
      Command.Put,
      'http://localhost/api/movies',
      undefined,
      halFormsTemplate
    );

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    requestServiceMock.computeHalFormsOptionsFromLink.mockImplementation(() => {});
    needInfoSubject.next(event);

    expect((halFormsTemplates._templates.withMultipleOptions.properties[0] as any).value).toEqual([
      'Movie 1',
      'Movie 2',
    ]);
  });

  it('should compute HAL-FORMS with multiple options and no selected values', () => {
    const halFormsTemplate = {
      key: 'withMultipleOptionsAndNoSelectedValues',
      value: halFormsTemplates._templates.withMultipleOptionsAndNoSelectedValues,
    };

    const event: HttpRequestEvent = new HttpRequestEvent(
      EventType.FillHttpRequest,
      Command.Put,
      'http://localhost/api/movies',
      undefined,
      halFormsTemplate
    );

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    requestServiceMock.computeHalFormsOptionsFromLink.mockImplementation(() => {});
    needInfoSubject.next(event);

    expect((halFormsTemplates._templates.withMultipleOptionsAndNoSelectedValues.properties[0] as any).value).toEqual([
      'Movie 1',
    ]);
  });

  it('should ignore HAL-FORMS options with malformed inline (no array)', () => {
    const halFormsTemplate = {
      key: 'withOptionsAndMalformedInline',
      value: halFormsTemplates._templates.withOptionsAndMalformedInline,
    };

    const event: HttpRequestEvent = new HttpRequestEvent(
      EventType.FillHttpRequest,
      Command.Put,
      'http://localhost/api/movies',
      undefined,
      halFormsTemplate
    );

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    requestServiceMock.computeHalFormsOptionsFromLink.mockImplementation(() => {});
    needInfoSubject.next(event);

    expect((halFormsTemplates._templates.withOptionsAndMalformedInline.properties[0] as any).options).toBeUndefined();
  });

  it('should ignore HAL-FORMS options with malformed inline (malformed content)', () => {
    const halFormsTemplate = {
      key: 'withOptionsAndMalformedInline2',
      value: halFormsTemplates._templates.withOptionsAndMalformedInline2,
    };

    const event: HttpRequestEvent = new HttpRequestEvent(
      EventType.FillHttpRequest,
      Command.Put,
      'http://localhost/api/movies',
      undefined,
      halFormsTemplate
    );

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    requestServiceMock.computeHalFormsOptionsFromLink.mockImplementation(() => {});
    needInfoSubject.next(event);

    expect((halFormsTemplates._templates.withOptionsAndMalformedInline2.properties[0] as any).options).toBeUndefined();
  });

  it('should clear custom request headers', () => {
    component.tempRequestHeaders = [];
    component.tempRequestHeaders.push(new RequestHeader('', ''));

    component.clearRequestHeaders();

    expect(component.tempRequestHeaders.length).toBe(5);
    for (let i = 0; i < 5; i++) {
      expect(component.tempRequestHeaders[i].key).toBe('');
      expect(component.tempRequestHeaders[i].value).toBe('');
    }
  });

  it('should set custom accept request headers on empty request headers', () => {
    component.tempRequestHeaders = [];
    for (let i = 0; i < 5; i++) {
      component.tempRequestHeaders.push(new RequestHeader('', ''));
    }

    component.setAcceptRequestHeader('x');

    expect(component.tempRequestHeaders[0].key).toBe('Accept');
    expect(component.tempRequestHeaders[0].value).toBe('x');
  });

  it('should set custom accept request headers on non empty request headers', () => {
    component.tempRequestHeaders = [];
    for (let i = 0; i < 5; i++) {
      if (i < 2) {
        component.tempRequestHeaders.push(new RequestHeader('key' + i, 'y'));
      } else {
        component.tempRequestHeaders.push(new RequestHeader('', ''));
      }
    }

    component.setAcceptRequestHeader('x');

    expect(component.tempRequestHeaders[2].key).toBe('Accept');
    expect(component.tempRequestHeaders[2].value).toBe('x');
  });

  it('should set custom accept request headers on existing accept request header', () => {
    component.tempRequestHeaders = [];
    for (let i = 0; i < 5; i++) {
      component.tempRequestHeaders.push(new RequestHeader('', ''));
    }
    component.tempRequestHeaders[0].key = 'accept';

    component.setAcceptRequestHeader('x');

    expect(component.tempRequestHeaders[0].key).toBe('accept');
    expect(component.tempRequestHeaders[0].value).toBe('x');
  });

  it('should handle template with no properties', () => {
    const halFormsTemplate = {
      key: 'withNoProperties',
      value: halFormsTemplates._templates.withNoProperties,
    };
    component.halFormsProperties = undefined;
    const event: HttpRequestEvent = new HttpRequestEvent(
      EventType.FillHttpRequest,
      Command.Post,
      'http://localhost/api/movies',
      undefined,
      halFormsTemplate
    );

    needInfoSubject.next(event);

    expect(component.halFormsProperties).toBeUndefined();
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
});
