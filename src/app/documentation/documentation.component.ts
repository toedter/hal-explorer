import { Component, OnInit, ViewEncapsulation, inject, HostListener } from '@angular/core';
import { RequestService } from '../request/request.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AppService } from '../app.service';

@Component({
  selector: 'app-documentation',
  templateUrl: './documentation.component.html',
  styleUrls: ['./documentation.component.css'],
  encapsulation: ViewEncapsulation.None,
  imports: [],
})
export class DocumentationComponent implements OnInit {
  docUri: SafeResourceUrl;
  iframeHeight = '0px';
  isScrollable = false;

  private readonly requestService = inject(RequestService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly appService = inject(AppService);

  ngOnInit() {
    this.requestService.getDocumentationObservable().subscribe({
      next: (docUri: string) => {
        this.docUri = this.sanitizer.bypassSecurityTrustResourceUrl(docUri);
        this.updateIframeHeight();
      },
      error: error => console.error('DocumentationComponent: ' + error),
    });
    this.requestService.getResponseObservable().subscribe(() => {
      this.docUri = undefined;
    });

    this.appService.scrollableDocumentationObservable.subscribe(scrollable => {
      this.isScrollable = scrollable;
      this.updateIframeHeight();
    });
    this.isScrollable = this.appService.getScrollableDocumentation();
  }

  @HostListener('window:resize')
  onResize() {
    this.updateIframeHeight();
  }

  private updateIframeHeight() {
    if (this.isScrollable) {
      // Calculate height: viewport minus navbar (approx 56px) minus documentation header (approx 90px) minus minimal padding
      const navbarHeight = 56;
      const headerHeight = 90;
      const padding = 10; // Reduced padding for better space utilization
      const availableHeight = window.innerHeight - navbarHeight - headerHeight - padding;
      this.iframeHeight = `${Math.max(300, availableHeight)}px`; // Minimum 300px
    } else {
      this.iframeHeight = '0px';
    }
  }
}

// The following functions ported to Typescript from from https://www.dyn-web.com/tutorials/iframes/height/
export function getDocHeight(doc): number {
  doc = doc || document;
  // stackoverflow.com/questions/1145850/
  const body = doc.body;
  const html = doc.documentElement;
  return Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
}

(window as any).setIframeHeight = id => {
  const iFrame: any = document.getElementById(id);
  iFrame.style.visibility = 'hidden';
  iFrame.style.height = '10px'; // reset to minimal height ...
  iFrame.style.visibility = 'visible';
  try {
    const doc = iFrame.contentDocument ? iFrame.contentDocument : iFrame.contentWindow.document;
    iFrame.style.height = getDocHeight(doc) + 4 + 'px';
  } catch {
    // this exception most likely occurs when the iFrame's URL has a CORS issue
    // then just take the original document as base
    iFrame.style.height = getDocHeight(document) - 130 + 'px';
  }
};
