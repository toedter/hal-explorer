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
    return element.all(by.cssContainingText('h5', 'JSON Properties')).first();
  }

  getFirstLinksSection(): ElementFinder {
    return element.all(by.cssContainingText('h5', 'Links')).first();
  }

  getEmbeddedSection(): ElementFinder {
    return element(by.cssContainingText('h5', 'Embedded Resources'));
  }

  getResponseStatusSection(): ElementFinder {
    return element(by.cssContainingText('h5', 'Response Status'));
  }

  getResponseHeadersSection(): ElementFinder {
    return element(by.cssContainingText('h5', 'Response Headers'));
  }

  getResponseBodySection(): ElementFinder {
    return element(by.cssContainingText('h5', 'Response Body'));
  }

  getDocumentationSection(): ElementFinder {
    return element(by.cssContainingText('h5', 'Documentation'));
  }

  getFirstPostButton(): ElementFinder {
    return element.all(by.css('.icon-plus')).first();
  }

  getLastPostButton(): ElementFinder {
    return element.all(by.css('.icon-plus')).last();
  }

  getLastGetButton(): ElementFinder {
    return element.all(by.css('.icon-left-open')).last();
  }

  getGoButton(): ElementFinder {
    return element(by.id('requestDialogGoButton'));
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

  getPost2Input(): ElementFinder {
    return element(by.id('request-input-post2'));
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

  getPostBody(): ElementFinder {
    return element(by.id('body'));
  }

}
