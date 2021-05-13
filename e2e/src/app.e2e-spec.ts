import { AppPage } from './app.po';
import { browser, protractor } from 'protractor';
import { AppConfig } from './app.config';

describe( 'HAL-Explorer App', () => {
  let page: AppPage;

  const expectResponseDetailsAreDisplayed = () => {
    expect( page.getResponseStatusSection().isDisplayed() ).toBeTruthy();
    expect( page.getResponseHeadersSection().isDisplayed() ).toBeTruthy();
    expect( page.getResponseBodySection().isDisplayed() ).toBeTruthy();
  };

  beforeEach( () => {
    page = new AppPage();
  } );

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
    expect(page.getResponseStatusSection().isPresent()).toBeFalsy();
    expect(page.getResponseHeadersSection().isPresent()).toBeFalsy();
    expect(page.getResponseBodySection().isPresent()).toBeFalsy();

  });

  it('should display HAL sections when rendering users resource', () => {
    page.navigateTo('/#uri=' + AppConfig.getTestServerUrl() + 'movies.hal-forms.json');
    expect(page.getFirstPropertiesSection().isDisplayed()).toBeTruthy();
    expect(page.getFirstLinksSection().isDisplayed()).toBeTruthy();
    expect(page.getEmbeddedSection().isDisplayed()).toBeTruthy();
    expectResponseDetailsAreDisplayed();
  });

  it('should display only Links section when rendering root api', () => {
    page.navigateTo('/#uri=' + AppConfig.getTestServerUrl() + 'index.hal.json');
    expect(page.getFirstPropertiesSection().isPresent()).toBeFalsy();
    expect(page.getFirstLinksSection().isDisplayed()).toBeTruthy();
    expect(page.getEmbeddedSection().isPresent()).toBeFalsy();
    expectResponseDetailsAreDisplayed();
  });

  it('should display POST request dialog', () => {
    page.navigateTo('/#uri=' + AppConfig.getTestServerUrl() + 'movies.hal-forms.json');
    page.getFirstPostButton().click();
    browser.sleep(1000);

    browser.wait(protractor.ExpectedConditions.presenceOf(page.getGoButton()),
      5000, 'Element "Go!"-Button taking too long to appear in the DOM');
  });

  it('should display user profile in POST request dialog', () => {
    page.navigateTo('/#uri=' + AppConfig.getTestServerUrl() + 'index.hal.json');
    page.getFirstPostButton().click();
    browser.sleep(1000);
    const fullnameProfileLabel = page.getFullnameProfileLabel();

    browser.wait(protractor.ExpectedConditions.presenceOf(fullnameProfileLabel),
      5000, 'Label "Full name" taking too long to appear in the DOM');
  });

  it('should display expanded URI in HAL-FORMS GET request dialog', () => {
    page.navigateTo('/#uri=' + AppConfig.getTestServerUrl() + 'filter.hal-forms.json');
    page.getLastGetButton().click();

    browser.sleep(1000);
    const titleInput = page.getTitleInput();
    titleInput.sendKeys('myTitle');
    const completedInput = page.getCompletedInput();
    completedInput.sendKeys('true');

    const expandedUri = page.getExpandedUri();
    expect(expandedUri.getText()).toEqual('http://localhost:3000/filter.hal-forms.json?title=myTitle&completed=true');

    browser.wait(protractor.ExpectedConditions.presenceOf(titleInput),
      5000, 'Input for Title taking too long to appear in the DOM');
  });

  it( 'should display correct properties HAL-FORMS POST request dialog', () => {
    page.navigateTo( '/#uri=' + AppConfig.getTestServerUrl() + '2posts1get.hal-forms.json' );
    page.getLastPostButton().click();

    browser.sleep(1000);
    const post2Input = page.getPost2Input();
    post2Input.sendKeys('xxx');

    expect(page.getPostBody().getAttribute('value')).toEqual('{\n  "post2": "xxx"\n}');

    browser.wait( protractor.ExpectedConditions.presenceOf( post2Input ),
      5000, 'Input for Title taking too long to appear in the DOM' );
  } );

} );

