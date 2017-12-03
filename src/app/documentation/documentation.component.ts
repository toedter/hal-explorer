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
  private docUri: SafeResourceUrl;

  constructor(private requestService: RequestService, private sanitizer: DomSanitizer) {
  }

  ngOnInit() {
    this.requestService.getDocumentationObservable()
      .subscribe((docUri: string) => {
          console.log('DocumentationComponent got notified');
          this.docUri = this.sanitizer.bypassSecurityTrustResourceUrl(docUri);
        },
        error => console.error('DocumentationComponent: ' + error));
    this.requestService.getResponseObservable()
      .subscribe(() => {
        this.docUri = undefined;
      });
  }
}
