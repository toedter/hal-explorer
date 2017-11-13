import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {CallerService} from '../caller/caller.service';

@Component({
  selector: 'app-url-input',
  templateUrl: './url-input.component.html',
  styleUrls: ['./url-input.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class UrlInputComponent implements OnInit {
  private url;

  constructor(private callerService: CallerService) {
    this.url = window.location.hash.substring(1);
    if (!this.url) {
      this.url = 'http://localhost:8080/api';
      window.location.hash = this.url;
    }
    window.addEventListener('hashchange', () => this.goFromHashChange(), false);
  }

  ngOnInit() {
    this.go();
  }

  public go() {
    console.log('go to: ' + this.url);
    this.callerService.callURL(this.url);
    window.location.hash = this.url;
  }

  public goFromHashChange() {
    this.url = window.location.hash.substring(1);
    console.log('go after hash change to: ' + this.url);
    this.callerService.callURL(this.url);
  }

}
