import {AppPage} from './app.po';
import {browser} from 'protractor';

describe('HAL-Explorer App', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });

  it('should have title "HAL-Explorer"', async () => {
    page.navigateTo();
    expect(await browser.getTitle()).toBe('HAL-Explorer');
  });

  it('should display "Explorer" section title', () => {
    page.navigateTo();
    expect(page.getExplorerText()).toEqual('Explorer');
  });
});
