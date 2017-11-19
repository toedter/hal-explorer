import {Component, OnInit} from '@angular/core';
import {CallerService} from '../caller/caller.service';
import * as $ from 'jquery';

@Component({
  selector: 'app-url-input',
  templateUrl: './url-input.component.html',
  styleUrls: ['./url-input.component.css']
})
export class UrlInputComponent implements OnInit {
  url: string;
  newRequestUrl: string;

  constructor(private callerService: CallerService) {
  }

  ngOnInit() {
    this.url = window.location.hash.substring(1);
    if (!this.url) {
      this.url = 'http://localhost:8080/api';
      window.location.hash = this.url;
    }
    window.addEventListener('hashchange', () => this.goFromHashChange(), false);

    this.callerService.getNeedInfoObservable().subscribe((value: string) => {
      console.log('Got caller service notification: ' + value);
      this.newRequestUrl = value;
      $('#requestModalTrigger').click();
    });

    this.go();
  }

  public go() {
    this.callerService.callURL(this.url);
  }

  public goToNew() {
    this.callerService.callURL(this.newRequestUrl);
  }

  public goFromHashChange() {
    this.url = window.location.hash.substring(1);
    this.callerService.callURL(this.url);
  }

}
