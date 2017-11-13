import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {CallerService} from '../caller/caller.service';

@Component({
  selector: 'app-url-input',
  templateUrl: './url-input.component.html',
  styleUrls: ['./url-input.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class UrlInputComponent implements OnInit {
  private url = 'http://localhost:8080/api/users';

  constructor(private callerService: CallerService) {
  }

  ngOnInit() {
  }

  public go() {
    console.log('go to: ' + this.url);
    this.callerService.callURL(this.url);
  }
}
