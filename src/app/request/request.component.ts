import { Component, OnInit } from '@angular/core';
import * as $ from 'jquery';
import * as utpl from 'uri-templates';
import { AppService, RequestHeader } from '../app.service';
import { Command, EventType, HttpRequestEvent, RequestService, UriTemplateEvent } from './request.service';

@Component({
  selector: 'app-uri-input',
  templateUrl: './request.component.html',
  styleUrls: ['./request.component.css']
})
export class RequestComponent implements OnInit {
  uri: string;
  uriTemplateEvent: UriTemplateEvent = new UriTemplateEvent(EventType.FillUriTemplate, '', []);
  httpRequestEvent: HttpRequestEvent = new HttpRequestEvent(EventType.FillHttpRequest, Command.Post, '');
  newRequestUri: string;
  requestBody: string;
  selectedHttpMethod: Command;
  commandPlaceholder = Command;
  requestHeaders: RequestHeader[];
  tempRequestHeaders: RequestHeader[];
  hasCustomRequestHeaders: boolean;
  jsonSchema: any;
  halFormsProperties: any;
  halFormsTemplates: any;
  halFormsDialogTitle: string;

  constructor(private appService: AppService, private requestService: RequestService) {
  }

  ngOnInit() {
    this.jsonSchema = undefined;
    this.halFormsProperties = undefined;
    this.uri = this.appService.getUri();
    this.tempRequestHeaders = this.appService.getCustomRequestHeaders();

    this.requestService.getNeedInfoObservable().subscribe((value: any) => {
      if (value.type === EventType.FillUriTemplate) {
        this.uriTemplateEvent = value as UriTemplateEvent;
        this.computeUriFromTemplate();
        $('#requestModalTrigger').trigger('click');
      } else if (value.type === EventType.FillHttpRequest) {
        const event: HttpRequestEvent = value as HttpRequestEvent;
        this.httpRequestEvent = event;
        if (event.jsonSchema) {
          this.jsonSchema = event.jsonSchema.properties;
        }
        if (event.halFormsTemplates) {
          this.halFormsTemplates = event.halFormsTemplates;
          this.halFormsProperties = this.getHalFormsPropertiesForHttpMethod(event.command);
          this.halFormsDialogTitle = this.getHalFormsTitleForHttpMethod(event.command);
        }
        this.requestBody = '';
        this.selectedHttpMethod = event.command;
        $('#HttpRequestTrigger').trigger('click');
      }
    });

    this.appService.uriObservable.subscribe(url => this.goFromHashChange(url));
    this.appService.requestHeadersObservable.subscribe(requestHeaders => {
      this.tempRequestHeaders = requestHeaders;
      this.updateRequestHeaders();
    });

    this.updateRequestHeaders();
    this.getUri();
  }

  public getUri() {
    this.requestService.getUri(this.uri);
  }

  public getExpandedUri() {
    this.requestService.getUri(this.newRequestUri);
  }

  public createOrUpdateResource() {
    this.requestService.requestUri(this.httpRequestEvent.uri, Command[this.selectedHttpMethod], this.requestBody);
  }

  public goFromHashChange(uri: string) {
    this.uri = uri;
    this.requestService.getUri(this.uri);
  }

  public computeUriFromTemplate() {
    const uriTemplate = utpl(this.uriTemplateEvent.templatedUri);
    const templateParams = {};
    for (const parameter of this.uriTemplateEvent.parameters) {
      if (parameter.value.length > 0) {
        templateParams[parameter.key] = parameter.value;
      }
    }
    this.newRequestUri = uriTemplate.fill(templateParams);
  }

  public requestBodyChanged() {
    let hasProperties = false;
    this.requestBody = '{\n';
    if (this.jsonSchema) {
      for (const key of Object.keys(this.jsonSchema)) {
        if (this.jsonSchema[key].value && this.jsonSchema[key].value.length > 0) {
          if (hasProperties) {
            this.requestBody += ',\n';
          }
          this.requestBody += '  "' + key + '": ' + (this.jsonSchema[key].type !== 'integer' ? '"' : '')
            + this.jsonSchema[key].value + (this.jsonSchema[key].type !== 'integer' ? '"' : '');
          hasProperties = true;
        }
      }
    } else if (this.halFormsProperties) {
      for (const item of this.halFormsProperties) {
        if (item.name && item.value) {
          if (hasProperties) {
            this.requestBody += ',\n';
          }
          this.requestBody += '  "' + item.name + '": ' + '"'
            + item.value + '"';
          hasProperties = true;
        }
      }
    }

    this.requestBody += '\n}';
  }

  public showEditHeadersDialog() {
    this.tempRequestHeaders = [];
    for (let i = 0; i < 5; i++) {
      if (this.requestHeaders.length > i) {
        this.tempRequestHeaders.push(new RequestHeader(this.requestHeaders[i].key, this.requestHeaders[i].value));
      } else {
        this.tempRequestHeaders.push(new RequestHeader('', ''));
      }
    }

    $('#requestHeadersModalTrigger').trigger('click');
  }

  public updateRequestHeaders() {
    this.requestHeaders = [];
    for (const requestHeader of this.tempRequestHeaders) {
      const key: string = requestHeader.key.trim();
      const value: string = requestHeader.value.trim();

      if (key.length > 0 && value.length > 0) {
        this.requestHeaders.push(new RequestHeader(key, value));
      }
    }
    this.requestService.setCustomHeaders(this.requestHeaders);
    this.hasCustomRequestHeaders = this.requestHeaders.length > 0;
    this.appService.setCustomRequestHeaders(this.requestHeaders);
  }

  public getTooltip(key: string): string {
    if (!this.jsonSchema) {
      return '';
    }
    let tooltip = this.jsonSchema[key].type;
    if (this.jsonSchema[key].format) {
      tooltip += ' in ' + this.jsonSchema[key].format + ' format';
    }
    return tooltip;
  }

  public getInputType(key: string): string {
    return this.requestService.getInputType(this.jsonSchema[key].type, this.jsonSchema[key].format);
  }

  public supportsHttpMethod(command: Command): boolean {
    if (!this.halFormsProperties) {
      return true;
    }

    let hasHttpMethod = false;
    Object.getOwnPropertyNames(this.halFormsTemplates).forEach(
      (val: string) => {
        if (this.halFormsTemplates[val].method === Command[command].toLowerCase() && this.selectedHttpMethod === command) {
          hasHttpMethod = true;
        }
      }
    );
    return hasHttpMethod;
  }

  public getHalFormsPropertiesForHttpMethod(command: Command) {
    let properties;
    if (!this.halFormsTemplates) {
      return properties;
    }

    Object.getOwnPropertyNames(this.halFormsTemplates).forEach(
      (val: string) => {
        if (this.halFormsTemplates[val].method === Command[command].toLowerCase()) {
          properties = this.halFormsTemplates[val].properties;
        }
      }
    );
    return properties;
  }

  public getHalFormsTitleForHttpMethod(command: Command): string {
    let title;
    if (!this.halFormsTemplates) {
      return title;
    }

    Object.getOwnPropertyNames(this.halFormsTemplates).forEach(
      (val: string) => {
        if (this.halFormsTemplates[val].method === Command[command].toLowerCase()) {
          title = this.halFormsTemplates[val].title;
        }
      }
    );
    return title;
  }

  getValidationErrors(ngModel: any): string {
    if (!ngModel.errors) {
      return '';
    }

    let errorMessage = '';

    if (ngModel.errors.required) {
      errorMessage = 'Value is required\n';
    }

    if (ngModel.errors.pattern) {
      errorMessage += 'Value does not match pattern: ' + ngModel.errors.pattern.requiredPattern + '\n';
    }

    if (ngModel.errors.maxlength) {
      errorMessage += 'Value does not have required max length: ' + ngModel.errors.maxlength.requiredLength + '\n';
    }

    if (ngModel.errors.minlength) {
      errorMessage += 'Value does not have required min length: ' + ngModel.errors.minlength.requiredLength + '\n';
    }

    if (ngModel.errors.max) {
      errorMessage += 'Value is bigger than max: ' + ngModel.errors.max.max + '\n';
    }

    if (ngModel.errors.min) {
      errorMessage += 'Value is smaller than min: ' + ngModel.errors.min.min + '\n';
    }

    return errorMessage;
  }
}

