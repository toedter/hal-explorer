import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
import {HttpResponse} from '@angular/common/http';
import {Command, RequestService} from '../request/request.service';
import {JsonHighlighterService} from '../json-highlighter/json-highlighter.service';

@Component({
  selector: 'app-response-explorer',
  templateUrl: './response-explorer.component.html',
  styleUrls: ['./response-explorer.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ResponseExplorerComponent implements OnInit {
  @Input() jsonRoot: any;
  @Input() prefix: string;
  @Input() curieLinks: Link[];

  properties: string;
  links: Link[];
  embedded: EmbeddedRessource[];

  showProperties: boolean;
  showLinks: boolean;
  showEmbedded: boolean;

  command = Command;

  constructor(private requestService: RequestService,
              private jsonHighlighterService: JsonHighlighterService) {
  }

  ngOnInit() {
    if (this.jsonRoot) {
      this.processJsonObject(this.jsonRoot);
    } else {
      this.requestService.getResponseObservable()
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
    if (!this.curieLinks) {
      this.curieLinks = new Array(0);
    }
    if (links) {
      this.showLinks = true;
      Object.getOwnPropertyNames(links).forEach(
        (val: string) => {
          if (links[val] instanceof Array) {
            links[val].forEach(
              (entry: Link, i: number) => {
                if (val === 'curies') {
                  this.curieLinks.push(entry);
                }
                this.links.push(new Link(val + ' [' + i + ']', entry.href, entry.title, entry.name));
              });
          } else {
            this.links.push(new Link(val, links[val].href, links[val].title, links[val].name));
          }
        }
      );

      this.curieLinks.forEach((curie: Link) => {
        this.links.forEach((link: Link) => {
          const curiePrefix = curie.name + ':';
          if (link.rel !== 'curies' && link.rel.startsWith(curiePrefix)) {
            link.docUri = curie.href.replace('{rel}', link.rel.replace(curiePrefix, ''));
          }
        });
      });
    }

    const embedded = json._embedded;
    this.embedded = new Array(0);
    if (embedded) {
      this.showEmbedded = true;
      let docUri;
      this.curieLinks.forEach((curie: Link) => {
          const curiePrefix = curie.name + ':';
          if (Object.keys(embedded)[0].startsWith(curiePrefix)) {
            docUri = curie.href.replace('{rel}', Object.keys(embedded)[0].replace(curiePrefix, ''));
          }
      });

      Object.getOwnPropertyNames(embedded).forEach(
        (val: string) => {
          this.embedded.push(new EmbeddedRessource(val, embedded[val], embedded[val] instanceof Array, docUri));
        }
      );
    }
  }

  public processCommand(command: Command, link: string) {
    this.requestService.processCommand(command, link);
  }
}

class Link {
  constructor(public rel: string, public href: string, public title: string, public name: string, public docUri?: string) {
  }
}

class EmbeddedRessource {
  constructor(public name: string, public content: any, public isArray: boolean, public docUri?: string) {
  }
}
