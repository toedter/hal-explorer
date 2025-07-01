import { enableProdMode, importProvidersFrom } from '@angular/core';
import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { bootstrapApplication, BrowserModule } from '@angular/platform-browser';

if (environment.production) {
  enableProdMode();
}

let bootstrapped = false;
function bootstrap() {
  bootstrapped = true;
  bootstrapApplication(AppComponent, {
    providers: [
      importProvidersFrom(BrowserModule, FormsModule),
      provideHttpClient(withInterceptorsFromDi())
    ]
  })
    .catch(err => console.log(err));
}

if (window.opener) {
  window.addEventListener('message', (event) => {
    window.sessionStorage.setItem(
      'hash',
      event.data,
    );
    window.dispatchEvent(new Event('storage'));
    if (!bootstrapped) {
      bootstrap();
    }
  });
  window.opener.postMessage("ready");
} else {
  bootstrap();
}
