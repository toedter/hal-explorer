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
    }
  }

  ngOnInit() {
    this.go();
  }

  public go() {
    console.log('go to: ' + this.url);
    window.location.hash = this.url;
    this.callerService.callURL(this.url);
  }
}
