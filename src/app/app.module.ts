import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {AppComponent} from './app.component';
import {UrlInputComponent} from './url-input/url-input.component';
import {ResponseBodyComponent} from './response-body/response-body.component';
import {CallerService} from './caller/caller.service';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {JsonHighlighterService} from './json-highlighter/json-highlighter.service';
import {ResponseExplorerComponent} from './response-explorer/response-explorer.component';
import {DocumentationComponent} from './documentation/documentation.component';

@NgModule({
  declarations: [
    AppComponent,
    UrlInputComponent,
    ResponseBodyComponent,
    ResponseExplorerComponent,
    DocumentationComponent
  ],
  imports: [
    BrowserModule, FormsModule, HttpClientModule
  ],
  providers: [CallerService, JsonHighlighterService],
  bootstrap: [AppComponent]
})
export class AppModule {
}
