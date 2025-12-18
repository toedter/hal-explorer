import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { RequestService } from '../request/request.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';


@Component({
    selector: 'app-documentation',
    templateUrl: './documentation.component.html',
    styleUrls: ['./documentation.component.css'],
    encapsulation: ViewEncapsulation.None,
    imports: []
})
export class DocumentationComponent implements OnInit {
  docUri: SafeResourceUrl;

  constructor(private requestService: RequestService, private sanitizer: DomSanitizer) {
  }

  ngOnInit() {
    this.requestService.getDocumentationObservable()
      .subscribe({
        next: (docUri: string) => {
          this.docUri = this.sanitizer.bypassSecurityTrustResourceUrl(docUri);
        },
        error: error => console.error('DocumentationComponent: ' + error)
      });
    this.requestService.getResponseObservable()
      .subscribe(() => {
        this.docUri = undefined;
      });
  }
}

// The following functions ported to Typescript from from https://www.dyn-web.com/tutorials/iframes/height/
export function getDocHeight(doc): number {
  doc = doc || document;
  // stackoverflow.com/questions/1145850/
  const body = doc.body;
  const html = doc.documentElement;
  return Math.max(body.scrollHeight, body.offsetHeight,
    html.clientHeight, html.scrollHeight, html.offsetHeight);
}

(window as any).setIframeHeight = (id) => {
  const iFrame: any = document.getElementById(id);
  iFrame.style.visibility = 'hidden';
  iFrame.style.height = '10px'; // reset to minimal height ...
  iFrame.style.visibility = 'visible';
  try {
    const doc = iFrame.contentDocument ? iFrame.contentDocument :
      iFrame.contentWindow.document;
    iFrame.style.height = getDocHeight(doc) + 4 + 'px';
  } catch {
    // this exception most likely occurs when the iFrame's URL has a CORS issue
    // then just take the original document as base
    iFrame.style.height = (getDocHeight(document) - 130) + 'px';
  }
};
