import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {HttpResponse} from '@angular/common/http';
import {CallerService} from '../caller/caller.service';
import {JsonHighlighterService} from '../json-highlighter/json-highlighter.service';

@Component({
  selector: 'app-response-explorer',
  templateUrl: './response-explorer.component.html',
  styleUrls: ['./response-explorer.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ResponseExplorerComponent implements OnInit {
  private properties: string;
  private links: Link[];

  constructor(private callerService: CallerService,
              private jsonHighlighterService: JsonHighlighterService) {
  }

  ngOnInit() {
    this.callerService.getResponse()
      .subscribe((response: HttpResponse<any>) => {
          const jsonProperties = Object.assign({}, response.body);
          delete jsonProperties._links;
          delete jsonProperties._embedded;
          this.properties =
            this.jsonHighlighterService.syntaxHighlight(JSON.stringify(jsonProperties, undefined, 2));

          const links = response.body._links;
          this.links = new Array(0);
          if (links) {

            Object.getOwnPropertyNames(links).forEach(
              (val: string, index: number, array) => {
                console.log(val + ' -> ' + links[val]);
                this.links.push(new Link(val, links[val].href));
              }
            );
          }
        },
        error => console.error('ResponseBodyComponent: ' + error));
  }

  public followLink(link: string) {
    console.log('link: ' + link);
    window.location.hash = link;
  }
}

class Link {
  constructor(private rel: string, private href: string) {
  }
}
