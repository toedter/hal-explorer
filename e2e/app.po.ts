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

  getFirstPropertiesSection(): ElementFinder {
    const elementFinder = element.all(by.cssContainingText('h5', 'JSON Properties')).first();
    return elementFinder;
  }

  getFirstLinksSection(): ElementFinder {
    const elementFinder = element.all(by.cssContainingText('h5', 'Links')).first();
    return elementFinder;
  }

  getEmbeddedSection(): ElementFinder {
    const elementFinder = element(by.cssContainingText('h5', 'Embedded Resources'));
    return elementFinder;
  }

  getResponseStatusSection(): ElementFinder {
    const elementFinder = element(by.cssContainingText('h5', 'Response Status'));
    return elementFinder;
  }

  getResponseHeadersSection(): ElementFinder {
    const elementFinder = element(by.cssContainingText('h5', 'Response Headers'));
    return elementFinder;
  }

  getResponseBodySection(): ElementFinder {
    const elementFinder = element(by.cssContainingText('h5', 'Response Body'));
    return elementFinder;
  }

  getDocumentationSection(): ElementFinder {
    const elementFinder = element(by.cssContainingText('h5', 'Documentation'));
    return elementFinder;
  }
}
