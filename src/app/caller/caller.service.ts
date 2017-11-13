import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpResponse} from '@angular/common/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';

@Injectable()
export class CallerService {
  private httpResponse: HttpResponse<any>;
  private responseSubject: Subject<HttpResponse<any>> = new Subject<HttpResponse<any>>();
  private responseObservable: Observable<HttpResponse<any>> = this.responseSubject.asObservable();

  constructor(private http: HttpClient) {
  }

  public getResponse(): Observable<HttpResponse<any>> {
    return this.responseObservable;
  }

  public callURL(url: string) {
    console.log('calling: ' + url);
    const myHeaders: HttpHeaders = new HttpHeaders(
      {
        'Accept': 'application/hal+json, application/json, */*'
      });

    this.http.get(url, {headers: myHeaders, observe: 'response'}).subscribe(
      (response: HttpResponse<any>) => {
        console.log(response);
        this.httpResponse = response;
        this.responseSubject.next(response);
      },
      err => {
        console.log('Error occured:' + err.toString());
      }
    );
  }
}
