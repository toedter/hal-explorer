import { TestBed, inject } from '@angular/core/testing';
import { RequestService } from './request.service';
import {AppService} from '../app.service';
import {HttpClient, HttpHandler} from '@angular/common/http';

describe('RequestService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RequestService, AppService, HttpClient, HttpHandler]
    });
  });

  it('should be created', inject([RequestService], (service: RequestService) => {
    expect(service).toBeTruthy();
  }));
});
