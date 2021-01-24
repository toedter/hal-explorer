import { inject, TestBed } from '@angular/core/testing';

import { JsonHighlighterService } from './json-highlighter.service';

describe( 'JsonHighlighterService', () => {
  let jsonHighlighterService: JsonHighlighterService;

  beforeEach( () => {
    TestBed.configureTestingModule( {
      providers: [JsonHighlighterService]
    } );
    jsonHighlighterService = TestBed.inject( JsonHighlighterService );
  } );

  it( 'should be created', inject( [JsonHighlighterService], (service: JsonHighlighterService) => {
    expect( service ).toBeTruthy();
  } ) );

  it( 'should highlight HAL JSON', inject( [JsonHighlighterService], (service: JsonHighlighterService) => {
    const output = jsonHighlighterService.syntaxHighlight( '{\n' +
      '  "_links": {\n' +
      '    "self": {\n' +
      '      "href": "/api/buildinfo"\n' +
      '    }\n' +
      '  }\n' +
      '}' );
    expect( output ).toBe( '{\n' +
      '  <span class="hal">"_links":</span> {\n' +
      '    <span class="key">"self":</span> {\n' +
      '      <span class="key">"href":</span> <span class="string">"/api/buildinfo"</span>\n' +
      '    }\n' +
      '  }\n' +
      '}' );
  } ) );

  it( 'should highlight number', inject( [JsonHighlighterService], (service: JsonHighlighterService) => {
    const output = jsonHighlighterService.syntaxHighlight( '{"number":0}' );
    expect( output ).toBe( '{<span class="key">"number":</span><span class="number">0</span>}' );
  } ) );

  it( 'should highlight boolean', inject( [JsonHighlighterService], (service: JsonHighlighterService) => {
    const output = jsonHighlighterService.syntaxHighlight( '{"key":true}' );
    expect( output ).toBe( '{<span class="key">"key":</span><span class="boolean">true</span>}' );
  } ) );

  it( 'should highlight null', inject( [JsonHighlighterService], (service: JsonHighlighterService) => {
    const output = jsonHighlighterService.syntaxHighlight( '{"key":null}' );
    expect( output ).toBe( '{<span class="key">"key":</span><span class="null">null</span>}' );
  } ) );

  it( 'should not highlight undefined input', inject( [JsonHighlighterService], (service: JsonHighlighterService) => {
    const output = jsonHighlighterService.syntaxHighlight( undefined );
    expect( output ).toBeUndefined();
  } ) );

  it( 'should not highlight invalid input', inject( [JsonHighlighterService], (service: JsonHighlighterService) => {
    const output = jsonHighlighterService.syntaxHighlight( '{{invalid}' );
    expect( output ).toBe('{{invalid}');
  } ) );
} );
