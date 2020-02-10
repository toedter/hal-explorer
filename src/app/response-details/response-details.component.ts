import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { RequestService } from '../request/request.service';
import { HttpResponse } from '@angular/common/http';
import { JsonHighlighterService } from '../json-highlighter/json-highlighter.service';

class ResponseHeader {
  constructor(private key: string, private value: string) {
  }
}

@Component( {
  selector: 'app-response-details',
  templateUrl: './response-details.component.html',
  styleUrls: ['./response-details.component.css'],
  encapsulation: ViewEncapsulation.None
} )
export class ResponseDetailsComponent implements OnInit {
  responseBody: string;
  responseHeaders: ResponseHeader[];
  responseStatus: number;
  responseStatusText: string;
  isString: boolean;

  constructor(private requestService: RequestService, private jsonHighlighterService: JsonHighlighterService) {
    this.responseStatus = 0;
  }

  ngOnInit() {
    this.requestService.getResponseObservable()
      .subscribe( (response: HttpResponse<any>) => {
          this.responseStatus = response.status;
          if (response.status !== 0) {
            this.responseStatusText = response.statusText;
          } else {
            this.responseStatusText = '';
          }
          this.responseBody = undefined;
          if (response.body) {
            if (typeof response.body === 'string' || response.body instanceof String) {
              this.isString = true;
              this.responseBody = response.body as string;
            } else {
              this.isString = false;
              this.responseBody =
                this.jsonHighlighterService.syntaxHighlight( JSON.stringify( response.body, undefined, 2 ) );
            }
          }
          const responseHeaderKeys: string[] = response.headers.keys();
          this.responseHeaders = new Array( responseHeaderKeys.length );
          for (const i in responseHeaderKeys) {
            if (responseHeaderKeys.hasOwnProperty( i )) {
              const key: string = responseHeaderKeys[i];
              const responseHeader: ResponseHeader = new ResponseHeader( key, response.headers.get( key ) );
              this.responseHeaders[i] = responseHeader;
            }
          }
        },
        error => console.error( 'ResponseBodyComponent: ' + error ) );
  }
}
