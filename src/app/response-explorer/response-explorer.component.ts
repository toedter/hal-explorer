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

  private properties: string;
  private links: Link[];
  private embedded: EmbeddedRessource[];

  private showProperties: boolean;
  private showLinks: boolean;
  private showEmbedded: boolean;

  constructor(private callerService: CallerService,
              private jsonHighlighterService: JsonHighlighterService) {
  }

  ngOnInit() {
    if (this.jsonRoot) {
      this.processJsonObject(this.jsonRoot);
    } else {
      this.callerService.getResponse()
        .subscribe((response: HttpResponse<any>) => {
            const json = Object.assign({}, response.body);
            this.processJsonObject(json);
          },
          error => console.error('ResponseBodyComponent: ' + error));
    }
  }

  private processJsonObject(json: any) {
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
        (val: string, index: number, array) => {
          this.links.push(new Link(val, links[val].href));
        }
      );
    }

    const embedded = json._embedded;
    this.embedded = new Array(0);
    if (embedded) {
      this.showEmbedded = true;
      Object.getOwnPropertyNames(embedded).forEach(
        (val: string, index: number, array) => {
          this.embedded.push(new EmbeddedRessource(val, embedded[val]));
        }
      );
    }
  }

  public followLink(link: string) {
    window.location.hash = link;
  }
}

class Link {
  constructor(private rel: string, private href: string) {
  }
}

class EmbeddedRessource {
  constructor(private name: string, private content: any) {
  }
}
