import {AppPage} from './app.po';
import {browser, protractor} from 'protractor';
import {AppConfig} from './app.config';

describe('HAL-Explorer App', () => {
  let page: AppPage;

  const expectResponseDetailsAreDisplayed = function () {
    expect(page.getResponseStatusSection().isDisplayed()).toBeTruthy();
    expect(page.getResponseHeadersSection().isDisplayed()).toBeTruthy();
    expect(page.getResponseBodySection().isDisplayed()).toBeTruthy();
  };

  beforeEach(() => {
    page = new AppPage();
  });

  it('should have title "HAL Explorer"', async () => {
    page.navigateTo();
    expect(await browser.getTitle()).toBe('HAL Explorer');
  });

  it('should display "Edit Headers" as button text', () => {
    page.navigateTo();
    expect(page.getEditHeadersButtonText()).toEqual('Edit Headers');
  });

  it('should not display HAL sections at startup', () => {
    page.navigateTo();
    expect(page.getFirstPropertiesSection().isPresent()).toBeFalsy();
    expect(page.getFirstLinksSection().isPresent()).toBeFalsy();
    expect(page.getEmbeddedSection().isPresent()).toBeFalsy();
    expect(page.getResponseStatusSection().isDisplayed()).toBeFalsy();
    expect(page.getResponseHeadersSection().isDisplayed()).toBeFalsy();
    expect(page.getResponseBodySection().isDisplayed()).toBeFalsy();

  });

  it('should display HAL sections when rendering users resource', () => {
    page.navigateTo('/#url=' + AppConfig.getChattyApiUrl() + '/users');
    expect(page.getFirstPropertiesSection().isDisplayed()).toBeTruthy();
    expect(page.getFirstLinksSection().isDisplayed()).toBeTruthy();
    expect(page.getEmbeddedSection().isDisplayed()).toBeTruthy();
    expectResponseDetailsAreDisplayed();
  });

  it('should display only Links section when rendering root api', () => {
    page.navigateTo('/#url=' + AppConfig.getChattyApiUrl());
    expect(page.getFirstPropertiesSection().isPresent()).toBeFalsy();
    expect(page.getFirstLinksSection().isDisplayed()).toBeTruthy();
    expect(page.getEmbeddedSection().isPresent()).toBeFalsy();
    expectResponseDetailsAreDisplayed();
  });

});

