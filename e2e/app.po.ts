import {browser, by, element, ElementFinder} from 'protractor';
import {AppConfig} from './app.config';
import {el} from '@angular/platform-browser/testing/src/browser_util';

export class AppPage {
  navigateTo(url?: string) {
    if (url) {
      return browser.get(url);
    }
    return browser.get('/');
  }

  getEditHeadersButtonText() {
    return element(by.buttonText('Edit Headers')).getText();
  }

  getPropertiesSection(): ElementFinder {
    const elementFinder = element(by.id('propertiesSection'));
    return elementFinder;
  }
}
