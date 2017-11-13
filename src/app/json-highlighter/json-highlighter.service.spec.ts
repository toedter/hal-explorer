import { TestBed, inject } from '@angular/core/testing';

import { JsonHighlighterService } from './json-highlighter.service';

describe('JsonHighlighterService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [JsonHighlighterService]
    });
  });

  it('should be created', inject([JsonHighlighterService], (service: JsonHighlighterService) => {
    expect(service).toBeTruthy();
  }));
});
