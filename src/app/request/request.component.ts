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
      console.log('Got caller service notification: ' + value);
      if (value.type === EventType.FillUriTemplate) {
        const event: UriTemplateEvent = <UriTemplateEvent>value;
        this.uriTemplateEvent = event;
        this.inputChanged();
        $('#requestModalTrigger').click();
      } else if (value.type === EventType.FillHttpRequest) {
        const event: HttpRequestEvent = <HttpRequestEvent>value;
        this.httpRequestEvent = event;
        this.inputChanged();
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

  public postUri() {
    this.requestService.postUri(this.httpRequestEvent.uri, this.postRequestBody);
  }

  public goFromHashChange() {
    this.uri = window.location.hash.substring(1);
    this.requestService.getUri(this.uri);
  }

  public inputChanged() {
    console.log('input changed');
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
