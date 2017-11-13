import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-documentation',
  templateUrl: './documentation.component.html',
  styleUrls: ['./documentation.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class DocumentationComponent implements OnInit {
  private docUrl = 'http://localhost:8080/docs/html5/users.html';
  private documentation: string;

  constructor(private http: HttpClient) {
  }

  ngOnInit() {
    // this.http.get(this.docUrl, {responseType: 'blob'}).subscribe(data => {
    //   // Read the result field from the JSON response.
    //   this.documentation = <any> (<Blob>data).slice();
    //   console.log(this.documentation);
    // });
  }

}
