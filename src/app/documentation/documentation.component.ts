import { Component, OnInit, ViewEncapsulation, inject, HostListener } from '@angular/core';
import { RequestService } from '../request/request.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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

  private readonly requestService = inject(RequestService);
  private readonly sanitizer = inject(DomSanitizer);

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
  }

  @HostListener('window:resize')
  onResize() {
    this.updateIframeHeight();
  }

  private updateIframeHeight() {
    // Calculate height: viewport minus navbar (approx 56px) minus documentation header (approx 90px) minus minimal padding
    const navbarHeight = 56;
    const headerHeight = 90;
    const padding = 10; // Reduced padding for better space utilization
    const additionalHeight = 20; // Additional height when scrollable
    const availableHeight = window.innerHeight - navbarHeight - headerHeight - padding + additionalHeight;
    this.iframeHeight = `${Math.max(300, availableHeight)}px`; // Minimum 300px
  }
}
