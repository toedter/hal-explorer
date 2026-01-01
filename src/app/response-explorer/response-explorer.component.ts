import { Component, Input, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { Command, RequestService, Response } from '../request/request.service';
import { JsonHighlighterService } from '../json-highlighter/json-highlighter.service';
import { HttpErrorResponse } from '@angular/common/http';
import { AppService } from '../app.service';
import { KeyValuePipe } from '@angular/common';

export class Link {
  constructor(
    public rel: string,
    public href: string,
    public title: string,
    public name: string,
    public docUri?: string,
    public options?: string
  ) {}
}

class EmbeddedResource {
  constructor(
    public name: string,
    public content: any,
    public isArray: boolean,
    public docUri?: string
  ) {}
}

export interface HalFormsTemplate {
  title?: string;
  method?: string;
  target?: string;
  contentType?: string;
  properties?: any[];
}

@Component({
  selector: 'app-response-explorer',
  templateUrl: './response-explorer.component.html',
  styleUrls: ['./response-explorer.component.css'],
  encapsulation: ViewEncapsulation.None,
  imports: [KeyValuePipe],
})
export class ResponseExplorerComponent implements OnInit {
  @Input() jsonRoot: any;
  @Input() prefix: string;
  @Input() curieLinks: Link[];
  @Input() isHalFormsMediaType: boolean;

  properties: string;
  links: Link[];
  selfLink: Link;
  embedded: EmbeddedResource[];
  templates: Record<string, HalFormsTemplate>;

  showProperties: boolean;
  showLinks: boolean;
  showEmbedded: boolean;
  hasHalFormsTemplates: boolean;
  isLoading = false;

  command = Command;
  responseUrl: string;
  httpErrorResponse: HttpErrorResponse;

  private readonly requestService = inject(RequestService);
  private readonly jsonHighlighterService = inject(JsonHighlighterService);
  private readonly appService = inject(AppService);

  ngOnInit(): void {
    this.requestService.getLoadingObservable().subscribe(loading => {
      this.isLoading = loading;
    });

    this.appService.httpOptionsObservable.subscribe(useHttpOptions => {
      if (this.links && this.links.length > 0) {
        if (useHttpOptions) {
          this.links.forEach(link => this.requestService.getHttpOptions(link));
        } else {
          // Clear options when HTTP OPTIONS is disabled
          this.links.forEach(link => {
            link.options = undefined;
          });
        }
      }
    });

    if (this.jsonRoot) {
      this.processJsonObject(this.jsonRoot);
    } else {
      this.subscribeToResponses();
    }
  }

  private subscribeToResponses(): void {
    this.requestService.getResponseObservable().subscribe({
      next: (response: Response) => {
        this.httpErrorResponse = response.httpErrorResponse;

        if (response.httpResponse) {
          this.handleSuccessResponse(response.httpResponse);
        } else if (this.httpErrorResponse) {
          this.handleErrorResponse(this.httpErrorResponse);
        }
      },
      error: error => console.error('Error during HTTP request: ' + JSON.stringify(error)),
    });
  }

  private handleSuccessResponse(httpResponse: any): void {
    this.responseUrl = httpResponse.url;
    this.isHalFormsMediaType = this.isHalFormsContent(httpResponse.headers, this.responseUrl, httpResponse.body);

    const body = typeof httpResponse.body === 'string' ? {} : httpResponse.body || {};
    this.processJsonObject(body);
  }

  private handleErrorResponse(errorResponse: HttpErrorResponse): void {
    this.responseUrl = errorResponse.url;
    this.isHalFormsMediaType = this.isHalFormsContent(errorResponse.headers, this.responseUrl, errorResponse.error);

    const error = typeof errorResponse.error === 'string' ? {} : errorResponse.error || {};
    this.processJsonObject(error);
  }

  private isHalFormsContent(headers: any, url: string, body: any): boolean {
    const contentType = headers.get('content-type');
    return Boolean(
      (contentType?.startsWith('application/prs.hal-forms+json') && body?._templates) ||
      (url?.endsWith('.hal-forms.json') && body?._templates)
    );
  }

  private processJsonObject(json: any): void {
    this.prefix = this.prefix || '';
    this.resetState();

    this.processProperties(json);
    this.processLinks(json._links);
    this.processEmbedded(json._embedded);
    this.processTemplates(json._templates);
  }

  private resetState(): void {
    this.showProperties = false;
    this.showLinks = false;
    this.showEmbedded = false;
    this.hasHalFormsTemplates = false;
    this.properties = null;
    this.links = [];
    this.embedded = [];
  }

  private processProperties(json: any): void {
    const jsonProperties = { ...json };
    delete jsonProperties._links;
    delete jsonProperties._embedded;
    delete jsonProperties._templates;

    if (Object.keys(jsonProperties).length > 0) {
      this.showProperties = true;
      this.properties = this.jsonHighlighterService.syntaxHighlight(JSON.stringify(jsonProperties, undefined, 2));
    }
  }

  private processLinks(linksObj: any): void {
    if (!linksObj) return;

    this.showLinks = true;
    this.links = [];
    this.selfLink = undefined;
    this.curieLinks = this.curieLinks || [];

    Object.getOwnPropertyNames(linksObj).forEach((rel: string) => {
      const linkData = linksObj[rel];

      if (Array.isArray(linkData)) {
        linkData.forEach((entry: Link, i: number) => {
          const link = new Link(`${rel} [${i}]`, entry.href, entry.title, entry.name);
          this.links.push(link);
          if (rel === 'curies') {
            this.curieLinks.push(entry);
          }
        });
      } else {
        const link = new Link(rel, linkData.href, linkData.title, linkData.name);
        this.links.push(link);
        if (rel === 'self') {
          this.selfLink = link;
        }
      }
    });

    if (this.appService.getHttpOptions()) {
      this.links.forEach(link => this.requestService.getHttpOptions(link));
    }

    this.enrichLinksWithDocumentation();
  }

  private enrichLinksWithDocumentation(): void {
    this.curieLinks.forEach((curie: Link) => {
      const curiePrefix = `${curie.name}:`;
      this.links.forEach((link: Link) => {
        if (link.rel !== 'curies' && link.rel.startsWith(curiePrefix)) {
          link.docUri = curie.href.replace('{rel}', link.rel.replace(curiePrefix, ''));
        }
      });
    });
  }

  private processEmbedded(embeddedObj: any): void {
    if (!embeddedObj) return;

    this.showEmbedded = true;
    this.embedded = [];

    const firstKey = Object.keys(embeddedObj)[0];
    const docUri = this.findDocUriForKey(firstKey);

    Object.getOwnPropertyNames(embeddedObj).forEach((key: string) => {
      this.embedded.push(new EmbeddedResource(key, embeddedObj[key], Array.isArray(embeddedObj[key]), docUri));
    });
  }

  private findDocUriForKey(key: string): string | undefined {
    for (const curie of this.curieLinks || []) {
      const curiePrefix = `${curie.name}:`;
      if (key.startsWith(curiePrefix)) {
        return curie.href.replace('{rel}', key.replace(curiePrefix, ''));
      }
    }
    return undefined;
  }

  private processTemplates(templatesObj: any): void {
    if (this.isHalFormsMediaType && templatesObj) {
      this.hasHalFormsTemplates = true;
      this.templates = templatesObj;
    }
  }

  processCommand(command: Command, link: string, template?: any): void {
    this.requestService.processCommand(command, link, template);
  }

  getLinkButtonClass(command: Command, link?: Link): string {
    if (link?.options) {
      if (link.options === 'http-options-error') {
        return 'btn-outline-dark';
      }
      if (!link.options.toLowerCase().includes(Command[command].toLowerCase())) {
        return 'btn-outline-light';
      }
      return '';
    }

    const isGetCommand = Command[command].toLowerCase() === 'get';
    if (!this.isHalFormsMediaType || isGetCommand || this.appService.getAllHttpMethodsForLinks()) {
      return '';
    }

    return 'btn-outline-light';
  }

  isButtonDisabled(command: Command, link?: Link): boolean {
    if (this.isLoading) {
      return true;
    }

    if (link?.options) {
      if (link.options === 'http-options-error') {
        return false;
      }
      return !link.options.toLowerCase().includes(Command[command].toLowerCase());
    }

    if (Command[command].toLowerCase() === 'get') {
      return false;
    }

    return !this.appService.getAllHttpMethodsForLinks() && this.isHalFormsMediaType;
  }

  getRelTargetUrl(href: string, command: Command): string {
    let target = href;

    if (this.isHalFormsMediaType && this.templates) {
      const commandStr = Command[command].toLowerCase();
      for (const templateName of Object.keys(this.templates)) {
        const template = this.templates[templateName];
        if (template.method === commandStr && template.target) {
          target = template.target;
          break;
        }
      }
    }

    if (this.responseUrl) {
      target = decodeURI(new URL(target, this.responseUrl).href);
    }

    return target;
  }

  getRequestButtonClass(command: Command): string {
    const base = 'ms-1 btn btn-sm nav-button ';
    const variants = {
      [Command.Get]: 'btn-outline-success',
      [Command.Post]: 'btn-outline-info',
      [Command.Put]: 'btn-outline-warning',
      [Command.Patch]: 'btn-outline-warning',
      [Command.Delete]: 'btn-outline-danger',
    };
    return base + (variants[command] || 'btn-outline-primary');
  }

  getCommandForTemplateMethod(method?: string): Command {
    if (!method) {
      return Command.Get;
    }
    const normalized = method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
    return Command[normalized as keyof typeof Command] || Command.Get;
  }

  getUrlForTemplateTarget(target?: string): string {
    return target || this.selfLink?.href || this.responseUrl || undefined;
  }
}
