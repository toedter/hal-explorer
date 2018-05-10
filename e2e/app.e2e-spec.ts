import {AppPage} from './app.po';
import {browser, protractor} from 'protractor';
import {AppConfig} from './app.config';

describe('HAL-Explorer App', () => {
  let page: AppPage;

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
    expect(page.getPropertiesSection().isPresent()).toBeFalsy();
  });

  it('should display HAL sections when rendering HAL resource', () => {
    page.navigateTo('/#url=' + AppConfig.getChattyApiUrl() + '/users');
    expect(page.getPropertiesSection().isPresent()).toBeTruthy();
  });

});
