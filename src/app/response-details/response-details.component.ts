import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {RequestService, Response} from '../request/request.service';
import {HttpErrorResponse, HttpResponse} from '@angular/common/http';
import {JsonHighlighterService} from '../json-highlighter/json-highlighter.service';

@Component({
  selector: 'app-response-details',
  templateUrl: './response-details.component.html',
  styleUrls: ['./response-details.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ResponseDetailsComponent implements OnInit {
  responseBody: string;
  error: string;
  isString: boolean;

  httpErrorResponse: HttpErrorResponse;
  httpResponse: HttpResponse<any>;

  constructor(private requestService: RequestService, private jsonHighlighterService: JsonHighlighterService) {
  }

  ngOnInit() {
    this.requestService.getResponseObservable()
      .subscribe((response: Response) => {
          this.httpResponse = response.httpResponse;
          this.httpErrorResponse = response.httpErrorResponse;
          if (this.httpResponse) {
            this.responseBody = undefined;
            if (this.httpResponse.body) {
              if (typeof this.httpResponse.body === 'string' || this.httpResponse.body instanceof String) {
                this.isString = true;
                this.responseBody = this.httpResponse.body as string;
              } else {
                this.isString = false;
                this.responseBody =
                  this.jsonHighlighterService.syntaxHighlight(JSON.stringify(this.httpResponse.body, undefined, 2));
              }
            }
          } else if (this.httpErrorResponse) {
            this.error = undefined;
            if (this.httpErrorResponse.error) {
              if (typeof this.httpErrorResponse.error === 'string' || this.httpErrorResponse.error instanceof String) {
                this.isString = true;
                this.error = this.httpErrorResponse.error as string;
              } else {
                this.isString = false;
                this.error =
                  this.jsonHighlighterService.syntaxHighlight(JSON.stringify(this.httpErrorResponse.error, undefined, 2));
              }
            }
          }

        },
        error => console.error('Error during HTTP request: ' + JSON.stringify(error)));
  }
}
