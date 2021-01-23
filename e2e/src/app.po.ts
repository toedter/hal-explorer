import {browser, by, element, ElementFinder} from 'protractor';

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

  getFirstPostButton(): ElementFinder {
    return element.all(by.css('.icon-plus')).first();
  }

  getLastGetButton(): ElementFinder {
    return element.all(by.css('.icon-left-open')).last();
  }

  getGoButton(): ElementFinder {
    return element(by.id('updateDialogGoButton'));
  }

  getFullnameProfileLabel(): ElementFinder {
    return element(by.cssContainingText('.col-form-label', 'Full name'));
  }

  getTitleLabel(): ElementFinder {
    return element(by.cssContainingText('.col-form-label', 'Title'));
  }

  getTitleInput(): ElementFinder {
    return element(by.id('request-input-title'));
  }

  getCompletedLabel(): ElementFinder {
    return element(by.cssContainingText('.col-form-label', 'Completed'));
  }

  getCompletedInput(): ElementFinder {
    return element(by.id('request-input-completed'));
  }

  getExpandedUri(): ElementFinder {
    return element(by.id('request-input-expanded-uri'));
  }

}
