import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {RequestService} from '../request/request.service';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';

@Component({
  selector: 'app-documentation',
  templateUrl: './documentation.component.html',
  styleUrls: ['./documentation.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class DocumentationComponent implements OnInit {
  docUri: SafeResourceUrl;

  constructor(private requestService: RequestService, private sanitizer: DomSanitizer) {
  }

  ngOnInit() {
    this.requestService.getDocumentationObservable()
      .subscribe((docUri: string) => {
          this.docUri = this.sanitizer.bypassSecurityTrustResourceUrl(docUri);
        },
        error => console.error('DocumentationComponent: ' + error));
    this.requestService.getResponseObservable()
      .subscribe(() => {
        this.docUri = undefined;
      });
  }

  getDocHeight() {
    return getDocHeight(document) - 150;
  }
}

// The following functions ported to Typescript from from https://www.dyn-web.com/tutorials/iframes/height/
export function getDocHeight(doc): number {
  doc = doc || document;
  // stackoverflow.com/questions/1145850/
  const body = doc.body;
  const html = doc.documentElement;
  const height = Math.max(body.scrollHeight, body.offsetHeight,
    html.clientHeight, html.scrollHeight, html.offsetHeight);
  return height;
}

(window as any).setIframeHeight = (id) => {
  try {
    const iFrame: any = document.getElementById(id);
    const doc = iFrame.contentDocument ? iFrame.contentDocument :
      iFrame.contentWindow.document;
    iFrame.style.visibility = 'hidden';
    iFrame.style.height = '10px'; // reset to minimal height ...
    iFrame.style.height = getDocHeight(doc) + 4 + 'px';
    iFrame.style.visibility = 'visible';
  } catch (e) {
    console.warn('Cannot set size for embedded documentation iFrame, will set it to default...');
  }
};
