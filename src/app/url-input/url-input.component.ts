import {Component, OnInit} from '@angular/core';
import {CallerService, EventType, UrlTemplateEvent, UrlTemplateParameter} from '../caller/caller.service';
import * as $ from 'jquery';

@Component({
  selector: 'app-url-input',
  templateUrl: './url-input.component.html',
  styleUrls: ['./url-input.component.css']
})
export class UrlInputComponent implements OnInit {
  url: string;
  urlTemplateEvent: UrlTemplateEvent = new UrlTemplateEvent(EventType.NeedUrlTemplate, '', []);
  newRequestUrl: string;

  constructor(private callerService: CallerService) {
  }

  ngOnInit() {
    this.url = window.location.hash.substring(1);
    if (!this.url) {
      this.url = 'http://localhost:8080/api';
      window.location.hash = this.url;
    }
    window.addEventListener('hashchange', () => this.goFromHashChange(), false);

    this.callerService.getNeedInfoObservable().subscribe((value: any) => {
      console.log('Got caller service notification: ' + value);
      if (value.type === EventType.NeedUrlTemplate) {
        const event: UrlTemplateEvent = <UrlTemplateEvent>value;
        this.urlTemplateEvent = event;
        this.inputChanged();
        $('#requestModalTrigger').click();
      }
    });

    this.go();
  }

  public go() {
    this.callerService.callURL(this.url);
  }

  public goToNew() {
    this.callerService.callURL(this.newRequestUrl);
  }

  public goFromHashChange() {
    this.url = window.location.hash.substring(1);
    this.callerService.callURL(this.url);
  }

  public inputChanged() {
    console.log('input changed');
    const templatedUrl = this.urlTemplateEvent.templatedUrl;
    this.newRequestUrl = templatedUrl.substring(0, templatedUrl.indexOf('{'));
    for (const parameter of this.urlTemplateEvent.parameters) {
      if (parameter.value.length > 0) {
        this.newRequestUrl =  this.newRequestUrl + '?' + parameter.key + '=' + parameter.value;
      }
    }
  }
}
