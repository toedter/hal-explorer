import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {CallerService} from '../caller/caller.service';
import {HttpHeaders, HttpResponse} from '@angular/common/http';
import {JsonHighlighterService} from '../json-highlighter/json-highlighter.service';

@Component({
  selector: 'app-response-body',
  templateUrl: './response-details.component.html',
  styleUrls: ['./response-details.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ResponseBodyComponent implements OnInit {
  responseBody: string;
  responseHeaders: ResponseHeader[];
  responseStatus: number;
  responseStatusText: string;

  constructor(private callerService: CallerService, private jsonHighlighterService: JsonHighlighterService) {
  }

  ngOnInit() {
    this.callerService.getResponse()
      .subscribe((response: HttpResponse<any>) => {
          this.responseStatus = response.status;
          this.responseStatusText = response.statusText;
          this.responseBody =
            this.jsonHighlighterService.syntaxHighlight(JSON.stringify(response.body, undefined, 2));
          const responseHeaderKeys: string[] = response.headers.keys();
          this.responseHeaders = new Array(responseHeaderKeys.length);
          for (const i in responseHeaderKeys) {
            const key: string = responseHeaderKeys[i];
            const responseHeader: ResponseHeader = new ResponseHeader(key, response.headers.get(key));
            this.responseHeaders[i] = responseHeader;
          }
        },
        error => console.error('ResponseBodyComponent: ' + error));
  }
}

class ResponseHeader {
  constructor(private key: string, private value: string) {
  }
}
