import { browser, by, element } from 'protractor';

export class AppPage {
  navigateTo() {
    return browser.get('/');
  }

  getExplorerText() {
    return element(by.css('app-root h3')).getText();
  }
}
