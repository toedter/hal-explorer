import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {AppComponent} from './app.component';
import {RequestComponent} from './request/request.component';
import {ResponseDetailsComponent} from './response-details/response-details.component';
import {RequestService} from './request/request.service';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {JsonHighlighterService} from './json-highlighter/json-highlighter.service';
import {ResponseExplorerComponent} from './response-explorer/response-explorer.component';
import {DocumentationComponent} from './documentation/documentation.component';
import {AppService} from './app.service';
import {RequestValidatorDirective} from './request/request-validator.directive';

@NgModule({
  declarations: [
    AppComponent,
    RequestComponent,
    ResponseDetailsComponent,
    ResponseExplorerComponent,
    DocumentationComponent,
    RequestValidatorDirective
  ],
  imports: [
    BrowserModule, FormsModule, HttpClientModule
  ],
  providers: [AppService, RequestService, JsonHighlighterService],
  bootstrap: [AppComponent]
})
export class AppModule {
}
