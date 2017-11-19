import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
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
  @Input() private jsonRoot: any;
  @Input() private prefix;

  private properties: string;
  private links: Link[];
  private embedded: EmbeddedRessource[];

  showProperties: boolean;
  showLinks: boolean;
  showEmbedded: boolean;

  constructor(private callerService: CallerService,
              private jsonHighlighterService: JsonHighlighterService) {
  }

  ngOnInit() {
    if (this.jsonRoot) {
      this.processJsonObject(this.jsonRoot);
    } else {
      this.callerService.getResponseObservable()
        .subscribe((response: HttpResponse<any>) => {
            const json = Object.assign({}, response.body);
            this.processJsonObject(json);
          },
          error => console.error('ResponseBodyComponent: ' + error));
    }
  }

  private processJsonObject(json: any) {
    if (!this.prefix) {
      this.prefix = '';
    }

    this.showProperties = false;
    this.showLinks = false;
    this.showEmbedded = false;

    this.properties = null;
    this.links = null;
    this.embedded = null;

    const jsonProperties = Object.assign({}, json);
    delete jsonProperties._links;
    delete jsonProperties._embedded;
    if (Object.keys(jsonProperties).length > 0) {
      this.showProperties = true;
      this.properties =
        this.jsonHighlighterService.syntaxHighlight(JSON.stringify(jsonProperties, undefined, 2));
    }

    const links = json._links;
    this.links = new Array(0);
    if (links) {
      this.showLinks = true;
      Object.getOwnPropertyNames(links).forEach(
        (val: string, index: number, array: string[]) => {
          if (links[val] instanceof Array) {
            links[val].forEach(
              (entry: Link, i: number) => {
                this.links.push(new Link(val + ' [' + i + ']', entry.href, entry.title, entry.name));
              });
          } else {
            this.links.push(new Link(val, links[val].href, links[val].title, links[val].name));
          }
        }
      );
    }

    const embedded = json._embedded;
    this.embedded = new Array(0);
    if (embedded) {
      this.showEmbedded = true;
      Object.getOwnPropertyNames(embedded).forEach(
        (val: string, index: number, array) => {
          this.embedded.push(new EmbeddedRessource(val, embedded[val], embedded[val] instanceof Array));
        }
      );
    }
  }

  public followLink(link: string) {
    this.callerService.callURL(link);
  }
}

class Link {
  constructor(public rel: string, public href: string, public title: string, public name: string) {
  }
}

class EmbeddedRessource {
  constructor(public name: string, public content: any, public isArray: boolean) {
  }
}
