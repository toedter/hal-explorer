import { browser, by, element } from 'protractor';

export class AppPage {
  navigateTo() {
    return browser.get('/');
  }

  getEditHeadersButtonText() {
    return element(by.buttonText('Edit Headers')).getText();
  }
}
