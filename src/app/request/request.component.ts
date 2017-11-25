import {Component, OnInit} from '@angular/core';
import {Command, EventType, HttpRequestEvent, RequestService, UriTemplateEvent} from './request.service';
import * as $ from 'jquery';

@Component({
  selector: 'app-url-input',
  templateUrl: './request.component.html',
  styleUrls: ['./request.component.css']
})
export class RequestComponent implements OnInit {
  uri: string;
  uriTemplateEvent: UriTemplateEvent = new UriTemplateEvent(EventType.FillUriTemplate, '', []);
  httpRequestEvent: HttpRequestEvent = new HttpRequestEvent(EventType.FillHttpRequest, Command.Post, '');
  newRequestUrl: string;
  postRequestBody: string;
  selectedHttpMethod: Command;
  commandPlaceholder = Command;

  constructor(private requestService: RequestService) {
  }

  ngOnInit() {
    this.uri = window.location.hash.substring(1);
    if (!this.uri) {
      this.uri = 'http://localhost:8080/api';
      window.location.hash = this.uri;
    }
    window.addEventListener('hashchange', () => this.goFromHashChange(), false);

    this.requestService.getNeedInfoObservable().subscribe((value: any) => {
      if (value.type === EventType.FillUriTemplate) {
        const event: UriTemplateEvent = <UriTemplateEvent>value;
        this.uriTemplateEvent = event;
        this.inputChanged();
        $('#requestModalTrigger').click();
      } else if (value.type === EventType.FillHttpRequest) {
        const event: HttpRequestEvent = <HttpRequestEvent>value;
        this.httpRequestEvent = event;
        this.inputChanged();
        this.selectedHttpMethod = event.command;
        $('#HttpRequestTrigger').click();
      }
    });

    this.getUri();
  }

  public getUri() {
    this.requestService.getUri(this.uri);
  }

  public getExpandedUri() {
    this.requestService.getUri(this.newRequestUrl);
  }

  public createOrUpdateResource() {
      this.requestService.requestUri(this.httpRequestEvent.uri, Command[this.selectedHttpMethod], this.postRequestBody);
  }

  public goFromHashChange() {
    this.uri = window.location.hash.substring(1);
    this.requestService.getUri(this.uri);
  }

  public inputChanged() {
    const templatedUrl = this.uriTemplateEvent.templatedUrl;
    this.newRequestUrl = templatedUrl.substring(0, templatedUrl.indexOf('{'));
    let separator = '?';
    for (const parameter of this.uriTemplateEvent.parameters) {
      if (parameter.value.length > 0) {
        this.newRequestUrl = this.newRequestUrl + separator + parameter.key + '=' + parameter.value;
        separator = '&';
      }
    }
  }
}
