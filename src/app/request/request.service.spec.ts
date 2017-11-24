import { TestBed, inject } from '@angular/core/testing';

import { RequestService } from './request.service';

describe('requestServiceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RequestService]
    });
  });

  it('should be created', inject([RequestService], (service: RequestService) => {
    expect(service).toBeTruthy();
  }));
});
