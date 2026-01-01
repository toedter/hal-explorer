import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Link, ResponseExplorerComponent } from './response-explorer.component';
import { Command, RequestService, Response } from '../request/request.service';
import { HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { JsonHighlighterService } from '../json-highlighter/json-highlighter.service';
import { Subject } from 'rxjs';
import { AppService } from '../app.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const halFormsResponse = {
  title: 'The Shawshank Redemption',
  year: 1994,
  _links: {
    self: {
      href: 'http://localhost:4200/api/movies/1',
    },
    movies: {
      href: 'http://localhost:4200/api/movies{?size,page}',
      templated: true,
    },
  },
  _templates: {
    default: {
      title: 'Ändere Film',
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
      title: 'Ändere Film (partiell)',
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
      title: 'Lösche Film',
      method: 'delete',
      contentType: '',
      properties: [],
    },
  },
};

describe('ResponseExplorerComponent', () => {
  let component: ResponseExplorerComponent;
  let fixture: ComponentFixture<ResponseExplorerComponent>;
  let responseSubject;
  let requestServiceMock;
  let jsonHighlighterServiceMock;
  let appServiceMock;

  beforeEach(async () => {
    requestServiceMock = {
      getResponseObservable: vi.fn(),
      getDocumentationObservable: vi.fn(),
      getLoadingObservable: vi.fn(),
      processCommand: vi.fn(),
      getHttpOptions: vi.fn(),
    };
    responseSubject = new Subject<Response>();
    vi.spyOn(responseSubject, 'subscribe');
    requestServiceMock.getResponseObservable.mockReturnValue(responseSubject);
    requestServiceMock.getLoadingObservable.mockReturnValue(new Subject<boolean>());

    appServiceMock = {
      getHttpOptions: vi.fn(),
      getAllHttpMethodsForLinks: vi.fn(),
      httpOptionsObservable: new Subject<boolean>(),
    };
    appServiceMock.getHttpOptions.mockReturnValue(true);
    appServiceMock.getAllHttpMethodsForLinks.mockReturnValue(false);
    jsonHighlighterServiceMock = {
      syntaxHighlight: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ResponseExplorerComponent],
      providers: [
        { provide: RequestService, useValue: requestServiceMock },
        { provide: JsonHighlighterService, useValue: jsonHighlighterServiceMock },
        { provide: AppService, useValue: appServiceMock },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResponseExplorerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it("should subscribe to request service's response observable", () => {
    expect(responseSubject.subscribe).toHaveBeenCalled();
  });

  it('should syntax highlight json', () => {
    responseSubject.next(new Response(new HttpResponse({ body: { key: 'test' } }), null));

    expect(jsonHighlighterServiceMock.syntaxHighlight).toHaveBeenCalled();
  });

  it('should not syntax highlight json when response body has no properties', () => {
    responseSubject.next(new HttpResponse({ body: {} }));

    expect(jsonHighlighterServiceMock.syntaxHighlight).not.toHaveBeenCalled();
  });

  it('should parse empty response body', () => {
    responseSubject.next(new HttpResponse({ body: {} }));

    expect(component.showProperties).toBeFalsy();
    expect(component.showLinks).toBeFalsy();
    expect(component.showEmbedded).toBeFalsy();
  });

  it('should parse HAL response body', () => {
    const halResponse = {
      text: 'hello all!',
      timeStamp: '2018-06-02T17:12:07.335Z',
      _links: {
        self: {
          href: 'https://chatty42.herokuapp.com/api/messages/1',
        },
        'chatty:chatMessage': {
          href: 'https://chatty42.herokuapp.com/api/messages/1{?projection}',
          templated: true,
        },
        curies: [
          {
            href: 'https://chatty42.herokuapp.com/api/../docs/html5/{rel}.html',
            name: 'chatty',
            templated: true,
          },
        ],
      },
      _embedded: {
        'chatty:author': {
          name: 'John',
        },
      },
    };

    responseSubject.next(new Response(new HttpResponse({ body: halResponse }), null));

    expect(component.showProperties).toBeTruthy();
    expect(component.showLinks).toBeTruthy();
    expect(component.showEmbedded).toBeTruthy();
    expect(component.hasHalFormsTemplates).toBeFalsy();
    expect(component.links.length).toBe(3);
    expect(component.embedded.length).toBe(1);
  });

  it('should parse HAL-FORMS response body', () => {
    const responseHeaders: HttpHeaders = new HttpHeaders({
      'content-type': 'application/prs.hal-forms+json',
    });
    responseSubject.next(new Response(new HttpResponse({ headers: responseHeaders, body: halFormsResponse }), null));

    expect(component.showProperties).toBeTruthy();
    expect(component.showLinks).toBeTruthy();
    expect(component.showEmbedded).toBeFalsy();
    expect(component.links.length).toBe(2);
    expect(component.embedded.length).toBe(0);
    expect(component.hasHalFormsTemplates).toBeTruthy();
  });

  it('should get HAL-FORMS link button class and state', () => {
    const responseHeaders: HttpHeaders = new HttpHeaders({
      'content-type': 'application/prs.hal-forms+json',
    });
    responseSubject.next(new Response(new HttpResponse({ headers: responseHeaders, body: halFormsResponse }), null));

    expect(component.getLinkButtonClass(Command.Get)).toBe('');
    expect(component.isButtonDisabled(Command.Get)).toBe(false);

    expect(component.getLinkButtonClass(Command.Post)).toBe('btn-outline-light');
    expect(component.isButtonDisabled(Command.Post)).toBe(true);

    expect(component.getLinkButtonClass(Command.Put)).toBe('btn-outline-light');
    expect(component.isButtonDisabled(Command.Put)).toBe(true);

    expect(component.getLinkButtonClass(Command.Patch)).toBe('btn-outline-light');
    expect(component.isButtonDisabled(Command.Patch)).toBe(true);

    expect(component.getLinkButtonClass(Command.Delete)).toBe('btn-outline-light');
    expect(component.isButtonDisabled(Command.Delete)).toBe(true);

    let link = new Link('rel', 'href', 'title', 'name', 'docUri', 'http-options-error');
    expect(component.getLinkButtonClass(Command.Get, link)).toBe('btn-outline-dark');
    expect(component.isButtonDisabled(Command.Get, link)).toBe(false);

    link = new Link('rel', 'href', 'title', 'name', 'docUri', 'POST');
    expect(component.getLinkButtonClass(Command.Get, link)).toBe('btn-outline-light');
    expect(component.isButtonDisabled(Command.Get, link)).toBe(true);

    link.options = 'get';
    expect(component.getLinkButtonClass(Command.Get, link)).toBe('');
  });

  it('should disable all buttons when loading', () => {
    const loadingSubject = new Subject<boolean>();
    requestServiceMock.getLoadingObservable.mockReturnValue(loadingSubject);

    // Create new component to trigger ngOnInit with new loading observable
    const newFixture = TestBed.createComponent(ResponseExplorerComponent);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();

    // Initially not loading
    expect(newComponent.isButtonDisabled(Command.Get)).toBe(false);

    // Set loading to true
    loadingSubject.next(true);

    // All buttons should be disabled when loading
    expect(newComponent.isButtonDisabled(Command.Get)).toBe(true);
    expect(newComponent.isButtonDisabled(Command.Post)).toBe(true);
    expect(newComponent.isButtonDisabled(Command.Put)).toBe(true);
    expect(newComponent.isButtonDisabled(Command.Patch)).toBe(true);
    expect(newComponent.isButtonDisabled(Command.Delete)).toBe(true);

    // With link
    const link = new Link('rel', 'href', 'title', 'name', 'docUri', 'GET');
    expect(newComponent.isButtonDisabled(Command.Get, link)).toBe(true);

    // Set loading to false
    loadingSubject.next(false);

    // Buttons should be enabled again based on normal rules
    expect(newComponent.isButtonDisabled(Command.Get)).toBe(false);
  });

  it('should get HAL-FORMS request button class and state', () => {
    const responseHeaders: HttpHeaders = new HttpHeaders({
      'content-type': 'application/prs.hal-forms+json',
    });
    responseSubject.next(new Response(new HttpResponse({ headers: responseHeaders, body: halFormsResponse }), null));

    expect(component.getRequestButtonClass(Command.Get)).toBe('ms-1 btn btn-sm nav-button btn-outline-success');
    expect(component.getRequestButtonClass(Command.Post)).toBe('ms-1 btn btn-sm nav-button btn-outline-info');
    expect(component.getRequestButtonClass(Command.Put)).toBe('ms-1 btn btn-sm nav-button btn-outline-warning');
    expect(component.getRequestButtonClass(Command.Patch)).toBe('ms-1 btn btn-sm nav-button btn-outline-warning');
    expect(component.getRequestButtonClass(Command.Delete)).toBe('ms-1 btn btn-sm nav-button btn-outline-danger');
    expect(component.getRequestButtonClass(undefined)).toBe('ms-1 btn btn-sm nav-button btn-outline-primary');
  });

  it('should populate HAL-FORMS request button class and state', () => {
    const responseHeaders: HttpHeaders = new HttpHeaders({
      'content-type': 'application/prs.hal-forms+json',
    });
    responseSubject.next(new Response(new HttpResponse({ headers: responseHeaders, body: halFormsResponse }), null));

    expect(component.getRequestButtonClass(Command.Post)).toBe('ms-1 btn btn-sm nav-button btn-outline-info');
  });

  it('should invoke request service when processing command', () => {
    component.processCommand(Command.Get, 'link');

    expect(requestServiceMock.processCommand).toHaveBeenCalled();
  });

  it('should get HAL-FORMS target', () => {
    const responseHeaders: HttpHeaders = new HttpHeaders({
      'content-type': 'application/prs.hal-forms+json',
    });

    const halFormsResponseWithTarget = {
      _links: {
        self: {
          href: 'http://localhost:4200/api/movies',
        },
      },
      _templates: {
        default: {
          title: 'Create Movie',
          method: 'post',
          contentType: '',
          properties: [],
          target: 'http://create-movie.com',
        },
      },
    };

    responseSubject.next(
      new Response(new HttpResponse({ headers: responseHeaders, body: halFormsResponseWithTarget }), null)
    );

    expect(component.getRelTargetUrl('xxx', Command.Post)).toBe('http://create-movie.com');
  });

  it('should get command for template method', () => {
    const postCommand = component.getCommandForTemplateMethod('POST');
    const unknownMethodCommand = component.getCommandForTemplateMethod('XXX');

    expect(postCommand).toBe(Command.Post);
    expect(unknownMethodCommand).toBe(Command.Get);
  });

  it('should get command for null template method', () => {
    const unknownMethodCommand = component.getCommandForTemplateMethod();

    expect(unknownMethodCommand).toBe(Command.Get);
  });

  it('should get uri for template target', () => {
    const href = 'http://api.com';
    (component.selfLink as any) = {};
    component.selfLink.href = href;

    expect(component.getUrlForTemplateTarget('xxx')).toBe('xxx');
    expect(component.getUrlForTemplateTarget(undefined)).toBe(href);
  });

  it('should initialize with jsonRoot set', () => {
    fixture = TestBed.createComponent(ResponseExplorerComponent);
    component = fixture.componentInstance;
    component.jsonRoot = {
      _links: {
        self: {
          href: 'http://localhost:4200/api/movies',
        },
      },
    };

    expect(component.selfLink).toBeUndefined();
    fixture.detectChanges();
    expect(component.selfLink).toBeDefined();
  });

  it('should log error during HTTP call', () => {
    vi.spyOn(window.console, 'error');

    responseSubject.error(new Response(null, new HttpErrorResponse({ status: 404, statusText: 'Not Found' })));

    expect(window.console.error).toHaveBeenCalled();
  });

  it('should ignore response bodies that are no strings', () => {
    responseSubject.next(new Response(new HttpResponse<any>({ body: 'this is a string' }), null));
    expect(component.properties).toBeNull();
  });

  it('should return response URL if no self link or target is available', () => {
    component.responseUrl = 'http://test.com';

    expect(component.getUrlForTemplateTarget(undefined)).toBe(component.responseUrl);
  });

  it('should return undefinedL if no self link or target or response URL is available', () => {
    expect(component.getUrlForTemplateTarget(undefined)).toBe(undefined);
  });

  it('should construct absolute URL', () => {
    responseSubject.next(
      new Response(
        new HttpResponse<any>({ body: '{"_links": { "self": { "href": "/test" }', url: 'http://localhost/' }),
        null
      )
    );
    expect(component.getRelTargetUrl('/test', Command.Get)).toBe('http://localhost/test');
  });

  it('should parse HAL-FORMS error response body (e.g., 401) and extract links and affordances', () => {
    const responseHeaders: HttpHeaders = new HttpHeaders({
      'content-type': 'application/prs.hal-forms+json',
    });
    const errorResponse = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
      headers: responseHeaders,
      error: halFormsResponse,
      url: 'http://localhost:4200/api/movies/1',
    });

    responseSubject.next(new Response(null, errorResponse));

    // Even though there's an error, the HAL-FORMS content should be processed
    expect(component.httpErrorResponse).toBeTruthy();
    expect(component.httpErrorResponse.status).toBe(401);
    expect(component.showProperties).toBeTruthy();
    expect(component.showLinks).toBeTruthy();
    expect(component.links.length).toBe(2);
    expect(component.hasHalFormsTemplates).toBeTruthy();
    expect(component.isHalFormsMediaType).toBeTruthy();
    expect(Object.keys(component.templates).length).toBe(3);
  });

  it('should handle error response with no body', () => {
    const errorResponse = new HttpErrorResponse({
      status: 500,
      statusText: 'Internal Server Error',
      url: 'http://localhost:4200/api/movies/1',
    });

    responseSubject.next(new Response(null, errorResponse));

    expect(component.httpErrorResponse).toBeTruthy();
    expect(component.showProperties).toBeFalsy();
    expect(component.showLinks).toBeFalsy();
    expect(component.hasHalFormsTemplates).toBeFalsy();
  });

  it('should handle error response with string body', () => {
    const errorResponse = new HttpErrorResponse({
      status: 404,
      statusText: 'Not Found',
      url: 'http://localhost:4200/api/movies/1',
      error: 'Resource not found',
    });

    responseSubject.next(new Response(null, errorResponse));

    expect(component.httpErrorResponse).toBeTruthy();
    expect(component.showProperties).toBeFalsy();
    expect(component.showLinks).toBeFalsy();
    expect(component.hasHalFormsTemplates).toBeFalsy();
  });

  it('should return undefined when curie href not found', () => {
    const halJsonWithCuriesAndEmbedded = {
      _links: {
        curies: [
          {
            name: 'doc',
            href: 'http://example.com/docs/{rel}',
            templated: true,
          },
        ],
        self: {
          href: 'http://example.com/api',
        },
      },
      _embedded: {
        'noprefix:items': [
          {
            name: 'Item 1',
          },
        ],
      },
    };

    const httpResponse = new HttpResponse({
      body: halJsonWithCuriesAndEmbedded,
      headers: new HttpHeaders({ 'Content-Type': 'application/hal+json' }),
    });
    responseSubject.next(new Response(httpResponse, null));

    // The embedded resource has a key "noprefix:items" that doesn't match the curie prefix "doc:"
    // So findDocUriForKey should return undefined
    expect(component.showEmbedded).toBeTruthy();
    expect(component.embedded.length).toBe(1);
    // The docUri should be undefined since no curie matched
    expect(component.embedded[0].docUri).toBeUndefined();
  });

  it('should trigger HTTP OPTIONS calls when httpOptionsObservable emits true', () => {
    const link1 = new Link('self', 'http://test.com/1', '', '');
    const link2 = new Link('items', 'http://test.com/items', '', '');
    component.links = [link1, link2];

    // Emit true to enable HTTP OPTIONS
    appServiceMock.httpOptionsObservable.next(true);

    expect(requestServiceMock.getHttpOptions).toHaveBeenCalledTimes(2);
    expect(requestServiceMock.getHttpOptions).toHaveBeenCalledWith(link1);
    expect(requestServiceMock.getHttpOptions).toHaveBeenCalledWith(link2);
  });

  it('should clear link options when httpOptionsObservable emits false', () => {
    const link1 = new Link('self', 'http://test.com/1', '', '', undefined, 'GET, POST, PUT');
    const link2 = new Link('items', 'http://test.com/items', '', '', undefined, 'GET, DELETE');
    component.links = [link1, link2];

    expect(link1.options).toBe('GET, POST, PUT');
    expect(link2.options).toBe('GET, DELETE');

    // Emit false to disable HTTP OPTIONS
    appServiceMock.httpOptionsObservable.next(false);

    expect(link1.options).toBeUndefined();
    expect(link2.options).toBeUndefined();
  });
});
