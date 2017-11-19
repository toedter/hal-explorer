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

  private needInfoSubject: Subject<string> = new Subject<string>();
  private needInfoObservable: Observable<string> = this.needInfoSubject.asObservable();

  constructor(private http: HttpClient) {
  }

  public getResponseObservable(): Observable<HttpResponse<any>> {
    return this.responseObservable;
  }

  public getNeedInfoObservable(): Observable<string> {
    return this.needInfoObservable;
  }

  public callURL(url: string) {
    const myHeaders: HttpHeaders = new HttpHeaders(
      {
        'Accept': 'application/hal+json, application/json, */*'
      });

    if (url.includes('{')) {
      url = url.substring(0, url.indexOf('{'));
      this.needInfoSubject.next(url);
      return;
    }

    this.http.get(url, {headers: myHeaders, observe: 'response'}).subscribe(
      (response: HttpResponse<any>) => {
        window.location.hash = url;
        this.httpResponse = response;
        this.responseSubject.next(response);
      },
      err => {
        console.log('Error occured:' + err.toString());
      }
    );
  }
}
