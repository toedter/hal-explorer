import {Component, OnInit} from '@angular/core';
import * as utpl from 'uri-templates';
import {URITemplate} from 'uri-templates';
import {AppService, RequestHeader} from '../app.service';
import {Command, EventType, HttpRequestEvent, RequestService, UriTemplateParameter} from './request.service';

export class DictionaryObject {
  constructor(public prompt, public value) {
  }
}

@Component({
  selector: 'app-uri-input',
  templateUrl: './request.component.html',
  styleUrls: ['./request.component.css']
})
export class RequestComponent implements OnInit {
  uri: string;
  isUriTemplate: boolean;
  templatedUri: string;
  uriTemplateParameters: UriTemplateParameter[];
  httpRequestEvent: HttpRequestEvent = new HttpRequestEvent(EventType.FillHttpRequest, Command.Post, '');
  originalRequestUri: string;
  newRequestUri: string;
  requestBody: string;
  selectedHttpMethod: Command;
  commandPlaceholder = Command;
  requestHeaders: RequestHeader[];
  tempRequestHeaders: RequestHeader[];
  hasCustomRequestHeaders: boolean;
  jsonSchema: any;
  halFormsProperties: any;
  halFormsTemplate: any;
  halFormsPropertyKey: string;
  halFormsContentType: string;

  noValueSelected = '<No Value Selected>';

  constructor(private appService: AppService, private requestService: RequestService) {
  }

  ngOnInit() {
    this.jsonSchema = undefined;
    this.halFormsProperties = undefined;
    this.halFormsContentType = undefined;
    this.uri = this.appService.getUri();
    this.tempRequestHeaders = this.appService.getCustomRequestHeaders();

    this.requestService.getNeedInfoObservable().subscribe(async (value: any) => {
      if (value.type === EventType.FillHttpRequest) {
        this.jsonSchema = undefined;
        this.halFormsProperties = undefined;
        this.halFormsPropertyKey = undefined;
        this.halFormsTemplate = undefined;

        const event: HttpRequestEvent = value as HttpRequestEvent;
        this.httpRequestEvent = event;
        if (event.jsonSchema) {
          this.jsonSchema = event.jsonSchema.properties;
        }
        if (event.halFormsTemplate) {
          this.halFormsTemplate = event.halFormsTemplate;
          this.halFormsProperties = this.halFormsTemplate.value.properties;
          if (this.halFormsTemplate.value.contentType) {
            this.halFormsContentType = this.halFormsTemplate.value.contentType;
          }
          if (Array.isArray(this.halFormsProperties)) {
            for (const property of this.halFormsProperties) {
              if (property.options) {
                const options = property.options;
                if (!options.inline && options.link) {
                  this.requestService.computeHalFormsOptionsFromLink(property);

                  // Hack to poll and wait for the asynchronous HTTP call
                  // that fills property.options.inline
                  for (let i = 0; i < 10; i++) {
                    if (!options.inline) {
                      try {
                        await new Promise((resolve) => setTimeout(resolve, 50));
                      } catch (e) {
                        // ignore
                      }
                    } else {
                      break;
                    }
                  }
                }
                if (!options.inline) {
                  console.warn('Cannot compute HAL-FORMS options for property "' + property.name + '".');
                  console.warn('Will ignore HAL-FORMS options for property "' + property.name + '".');
                  property.options = undefined;
                } else {
                  property.options.computedOptions = this.getHalFormsOptions(property);

                  if (options.selectedValues) {
                    if (options?.maxItems === 1) {
                      property.value = options.selectedValues[0];
                    } else {
                      property.value = options.selectedValues;
                    }
                  } else if (!property.required && !options.selectedValues && !(options?.minItems >= 1)) {
                    property.value = this.noValueSelected;
                  } else if (property.required && !options.selectedValues && options.computedOptions) {
                    if (options?.maxItems === 1) {
                      property.value = property.options.computedOptions[0].value;
                    } else {
                      property.value = [property.options.computedOptions[0].value];
                    }
                  }
                }
              }
            }
          }
          this.halFormsPropertyKey = this.halFormsTemplate.value.title;
        }
        this.requestBody = '';
        this.selectedHttpMethod = event.command;
        this.templatedUri = undefined;
        this.isUriTemplate = RequestComponent.isUriTemplated(event.uri);
        this.originalRequestUri = event.uri;
        if (this.isUriTemplate) {
          const uriTemplate: URITemplate = utpl(event.uri);
          this.uriTemplateParameters = [];
          for (const param of uriTemplate.varNames) {
            this.uriTemplateParameters.push(new UriTemplateParameter(param, ''));
          }
          this.templatedUri = event.uri;
          this.computeUriFromTemplate();
        } else {
          this.newRequestUri = event.uri;
        }

        const element = document.getElementById('HttpRequestTrigger');
        if (element) {
          element.click();
        }

        this.propertyChanged();
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

  getUri() {
    this.requestService.getUri(this.uri);
  }

  getExpandedUri() {
    this.requestService.getUri(this.newRequestUri);
  }

  makeHttpRequest() {
    this.requestService.requestUri(this.newRequestUri, Command[this.selectedHttpMethod], this.requestBody, this.halFormsContentType);
  }

  goFromHashChange(uri: string) {
    this.uri = uri;
    this.requestService.getUri(this.uri);
  }

  computeUriFromTemplate(checkHalFormsProperties = true) {
    const uriTemplate = utpl(this.templatedUri);
    const templateParams = {};
    for (const parameter of this.uriTemplateParameters) {
      if (parameter.value.length > 0) {
        templateParams[parameter.key] = parameter.value;
      }
    }
    this.newRequestUri = uriTemplate.fill(templateParams);
    if (this.halFormsProperties && checkHalFormsProperties) {
      this.propertyChanged();
    }
  }

  private static isUriTemplated(uri: string) {
    const uriTemplate = utpl(uri);
    return uriTemplate.varNames.length > 0;
  }

  propertyChanged() {
    this.requestBody = '{\n';

    if (this.templatedUri) {
      this.computeUriFromTemplate(false);
    } else if (this.originalRequestUri) {
      this.newRequestUri = this.originalRequestUri;
    }
    let hasQueryParams = false;
    if (this.jsonSchema) {
      for (const key of Object.keys(this.jsonSchema)) {
        if (this.jsonSchema[key].value && this.jsonSchema[key].value.length > 0) {
          if (hasQueryParams) {
            this.requestBody += ',\n';
          }
          this.requestBody += '  "' + key + '": ' + (this.jsonSchema[key].type !== 'integer' ? '"' : '')
            + this.jsonSchema[key].value + (this.jsonSchema[key].type !== 'integer' ? '"' : '');
          hasQueryParams = true;
        }
      }
    } else if (this.halFormsProperties) {
      if (this.templatedUri) {
        hasQueryParams = this.newRequestUri.includes('?');
      }
      for (const item of this.halFormsProperties) {
        let httpMethod = 'get';
        if (this.halFormsTemplate.value.method) {
          httpMethod = this.halFormsTemplate.value.method.toLowerCase();
        }
        if (httpMethod !== 'get' && httpMethod !== 'post' && httpMethod !== 'put' && httpMethod !== 'patch' && httpMethod !== 'delete') {
          httpMethod = 'get';
        }
        const hasBody = (httpMethod === 'post' || httpMethod === 'put' || httpMethod === 'patch');
        const optionsAsArray = item?.options?.maxItems !== 1;
        if (item.name && item.value && item.value !== '<No Value Selected>') {
          if (hasQueryParams) {
            if (hasBody) {
              this.requestBody += ',\n';
            } else {
              this.newRequestUri += '&';
            }
          } else {
            if (!hasBody) {
              this.newRequestUri += '?';
            }
          }

          if (hasBody) {
            if (optionsAsArray) {
              this.requestBody += '  "' + item.name + '": ' + JSON.stringify(item.value);
            } else {
              this.requestBody += '  "' + item.name + '": ' + '"' + item.value + '"';
            }
          } else {
            this.newRequestUri += item.name + '=' + item.value;
          }
          hasQueryParams = true;
        }
      }
    }

    this.requestBody += '\n}';
  }

  showEditHeadersDialog() {
    this.tempRequestHeaders = [];
    for (let i = 0; i < 5; i++) {
      if (this.requestHeaders.length > i) {
        this.tempRequestHeaders.push(new RequestHeader(this.requestHeaders[i].key, this.requestHeaders[i].value));
      } else {
        this.tempRequestHeaders.push(new RequestHeader('', ''));
      }
    }

    document.getElementById('requestHeadersModalTrigger').click();
  }

  updateRequestHeaders() {
    this.requestHeaders = [];
    for (const requestHeader of this.tempRequestHeaders) {
      const key: string = requestHeader.key.trim();
      const value: string = requestHeader.value.trim();

      if (key.length > 0 && value.length > 0) {
        this.requestHeaders.push(new RequestHeader(key, value));
      }
    }
    this.processRequestHeaders();
  }

  clearRequestHeaders() {
    this.tempRequestHeaders = [];
    for (let i = 0; i < 5; i++) {
      this.tempRequestHeaders.push(new RequestHeader('', ''));
    }

    this.processRequestHeaders();
  }

  private processRequestHeaders() {
    this.requestService.setCustomHeaders(this.requestHeaders);
    this.hasCustomRequestHeaders = this.requestHeaders.length > 0;
    this.appService.setCustomRequestHeaders(this.requestHeaders);
  }

  setAcceptRequestHeader(value: string) {
    let acceptHeaderSet = false;
    for (let i = 0; i < 5; i++) {
      if (this.tempRequestHeaders[i].key.toLowerCase() === 'accept') {
        this.tempRequestHeaders[i].value = value;
        acceptHeaderSet = true;
        break;
      }
    }
    if (!acceptHeaderSet) {
      for (let i = 0; i < 5; i++) {
        if (this.tempRequestHeaders[i].key === '') {
          this.tempRequestHeaders[i].key = 'Accept';
          this.tempRequestHeaders[i].value = value;
          break;
        }
      }
    }
  }

  getTooltip(key: string): string {
    if (!this.jsonSchema) {
      return '';
    }
    let tooltip = this.jsonSchema[key].type;
    if (this.jsonSchema[key].format) {
      tooltip += ' in ' + this.jsonSchema[key].format + ' format';
    }
    return tooltip;
  }

  getInputType(key: string): string {
    return this.requestService.getInputType(this.jsonSchema[key].type, this.jsonSchema[key].format);
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

    if (ngModel.errors.email) {
      errorMessage += 'Value is not a valid email\n';
    }

    if (ngModel.errors.maxItems) {
      errorMessage += 'Selection exceeds the maximum number of items: ' + ngModel.errors.maxItems.maxItems + '\n';
    }

    if (ngModel.errors.minItems) {
      errorMessage += 'Selection falls below the minimum number of items: ' + ngModel.errors.minItems.minItems + '\n';
    }

    return errorMessage;
  }

  getUiElementForHalFormsTemplateProperty(property: any): string {
    if (property.options) {
      return 'select';
    }
    return 'input';
  }

  getHalFormsOptions(property: any): Array<DictionaryObject> {
    if (!property.options) {
      return [];
    }

    const options = property.options;
    const dictionaryObjects: Array<DictionaryObject> = [];

    if (!property.required && options.maxItems === 1 && !(options.minItems >= 1)) {
      dictionaryObjects.push(new DictionaryObject(this.noValueSelected, this.noValueSelected));
    }

    const promptField = options?.promptField || 'prompt';
    const valueField = options?.valueField || 'value';

    if (options.inline) {
      if (!(options.inline instanceof Array)) {
        console.warn('HAL-FORMS: Selectable options for property "' + property.name + '" must be an array');
        console.warn('=> Property "' + property.name + '" input will be rendered as HTML "input"');
        property.options = undefined; // this leads to updating the HTML to 'input' instead of 'select'
        return dictionaryObjects;
      }
      for (const entry of options.inline) {
        if (typeof entry === 'string' || entry instanceof String) {
          dictionaryObjects.push(new DictionaryObject(entry, entry));
        } else {
          if (entry[promptField] && entry[valueField]) {
            dictionaryObjects.push(new DictionaryObject(entry[promptField], entry[valueField]));
          } else {
            console.warn('HAL-FORMS: Selectable options for property "' + property.name + '" are not parsable');
            console.warn('=> Property "' + property.name + '" input will be rendered as HTML "input"');
            property.options = undefined; // this leads to updating the HTML to 'input' instead of 'select'
            return dictionaryObjects;
          }
        }
      }
    }
    return dictionaryObjects;
  }

  isHalFormsOptionSelected(property: any, value: string): boolean {
    if (!property.value) {
      return false;
    }
    return property.value.includes(value);
  }
}
