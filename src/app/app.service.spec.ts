import { AppService, RequestHeader } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(() => {
    window.location.hash = '';
    localStorage.clear();
    service = new AppService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set custom theme', () => {
    service.setTheme('Cosmo');
    expect(service.getTheme()).toBe('Cosmo');
    expect(localStorage.getItem('hal-explorer.theme')).toBe('Cosmo');
  });

  it('should set default theme', () => {
    service.setTheme('Default');
    expect(service.getTheme()).toBe('Default');
    expect(localStorage.getItem('hal-explorer.theme')).toBe('Default');
  });

  it('should set 2 column layout', () => {
    service.setLayout('2');
    expect(service.getLayout()).toBe('2');
    expect(localStorage.getItem('hal-explorer.layout')).toBe('2');
  });

  it('should set 3 column layout', () => {
    service.setLayout('3');
    expect(service.getLayout()).toBe('3');
    expect(localStorage.getItem('hal-explorer.layout')).toBe('3');
  });

  it('should set HTTP OPTIONS', () => {
    service.setHttpOptions(true);
    expect(service.getHttpOptions()).toBe(true);
    expect(localStorage.getItem('hal-explorer.httpOptions')).toBe('true');
  });

  it('should unset HTTP OPTIONS', () => {
    service.setHttpOptions(false);
    expect(service.getHttpOptions()).toBe(false);
    expect(localStorage.getItem('hal-explorer.httpOptions')).toBe('false');
  });

  it('should set all HTTP methods for links', () => {
    service.setAllHttpMethodsForLinks(true);
    expect(service.getAllHttpMethodsForLinks()).toBe(true);
    expect(localStorage.getItem('hal-explorer.allHttpMethodsForLinks')).toBe('true');
  });

  it('should unset all HTTP methods for links', () => {
    service.setAllHttpMethodsForLinks(false);
    expect(service.getAllHttpMethodsForLinks()).toBe(false);
    expect(localStorage.getItem('hal-explorer.allHttpMethodsForLinks')).toBe('false');
  });

  it('should not set invalid layout', () => {
    spyOn(window.console, 'error');

    service.setLayout('4');

    expect(service.getLayout()).toBe('2');
    // Layout should remain '2' (the default), but localStorage.getItem might be null if never set
    // The important thing is the service returns the correct default value
    expect(window.console.error).toHaveBeenCalled();
  });

  it('should set request headers', () => {
    const requestHeader1 = new RequestHeader('accept', 'application/json');
    const requestHeader2 = new RequestHeader('authorization', 'bearer euztsfghfhgwztuzt');

    service.setCustomRequestHeaders([requestHeader1, requestHeader2]);
    // second invocation is to trigger backup
    service.setCustomRequestHeaders([requestHeader1, requestHeader2]);

    expect(service.getCustomRequestHeaders()[0].key).toBe('accept');
    expect(service.getCustomRequestHeaders()[0].value).toBe('application/json');
    expect(service.getCustomRequestHeaders()[1].key).toBe('authorization');
    expect(service.getCustomRequestHeaders()[1].value).toBe('bearer euztsfghfhgwztuzt');
    expect(window.location.hash).toBe(
      '#hkey0=accept&hval0=application/json&hkey1=authorization&hval1=bearer%20euztsfghfhgwztuzt'
    );
  });

  it('should parse window location hash', () => {
    // Set localStorage values
    localStorage.setItem('hal-explorer.theme', 'Cosmo');
    localStorage.setItem('hal-explorer.layout', '3');
    localStorage.setItem('hal-explorer.httpOptions', 'true');
    localStorage.setItem('hal-explorer.allHttpMethodsForLinks', 'true');
    window.location.hash = '#hkey0=accept&hval0=text/plain&uri=https://chatty42.herokuapp.com/api/users';
    service = new AppService();

    expect(service.getCustomRequestHeaders()[0].key).toBe('accept');
    expect(service.getCustomRequestHeaders()[0].value).toBe('text/plain');
    expect(service.getLayout()).toBe('3');
    expect(service.getTheme()).toBe('Cosmo');
    expect(service.getHttpOptions()).toBeTrue();
    expect(service.getAllHttpMethodsForLinks()).toBeTrue();
    expect(service.getUri()).toBe('https://chatty42.herokuapp.com/api/users');
  });

  it('should parse window location hash with hval before hkey', () => {
    localStorage.setItem('hal-explorer.theme', 'Cosmo');
    localStorage.setItem('hal-explorer.layout', '3');
    window.location.hash = '#hval0=text/plain&hkey0=accept&uri=https://chatty42.herokuapp.com/api/users';
    service = new AppService();

    expect(service.getCustomRequestHeaders()[0].key).toBe('accept');
    expect(service.getCustomRequestHeaders()[0].value).toBe('text/plain');
    expect(service.getLayout()).toBe('3');
    expect(service.getTheme()).toBe('Cosmo');
    expect(service.getUri()).toBe('https://chatty42.herokuapp.com/api/users');
  });

  it('should parse window location hash with deprecated hkey "url"', () => {
    localStorage.setItem('hal-explorer.theme', 'Cosmo');
    localStorage.setItem('hal-explorer.layout', '3');
    window.location.hash = '#hval0=text/plain&hkey0=accept&url=https://chatty42.herokuapp.com/api/users';
    service = new AppService();

    expect(service.getCustomRequestHeaders()[0].key).toBe('accept');
    expect(service.getCustomRequestHeaders()[0].value).toBe('text/plain');
    expect(service.getLayout()).toBe('3');
    expect(service.getTheme()).toBe('Cosmo');
    expect(service.getUri()).toBe('https://chatty42.herokuapp.com/api/users');
  });

  it('should parse window location hash with unknown hkeys', () => {
    localStorage.setItem('hal-explorer.theme', 'Cosmo');
    localStorage.setItem('hal-explorer.layout', '3');
    window.location.hash = '#xxx=7&hval0=text/plain&hkey0=accept&yyy=xxx&url=https://chatty42.herokuapp.com/api/users';
    service = new AppService();

    expect(service.getCustomRequestHeaders()[0].key).toBe('accept');
    expect(service.getCustomRequestHeaders()[0].value).toBe('text/plain');
    expect(service.getLayout()).toBe('3');
    expect(service.getTheme()).toBe('Cosmo');
    expect(service.getUri()).toBe('https://chatty42.herokuapp.com/api/users');
  });

  it('should get observables', () => {
    service = new AppService();

    expect(service.layoutObservable).toBeDefined();
    expect(service.httpOptionsObservable).toBeDefined();
    expect(service.allHttpMethodsForLinksObservable).toBeDefined();
    expect(service.requestHeadersObservable).toBeDefined();
    expect(service.themeObservable).toBeDefined();
    expect(service.uriObservable).toBeDefined();
    expect(service.scrollableDocumentationObservable).toBeDefined();
  });

  it('should set scrollable documentation', () => {
    service.setScrollableDocumentation(true);
    expect(service.getScrollableDocumentation()).toBe(true);
    expect(localStorage.getItem('hal-explorer.scrollableDocumentation')).toBe('true');
  });

  it('should unset scrollable documentation', () => {
    service.setScrollableDocumentation(false);
    expect(service.getScrollableDocumentation()).toBe(false);
    expect(localStorage.getItem('hal-explorer.scrollableDocumentation')).toBe('false');
  });

  it('should parse scrollableDocumentation from localStorage', () => {
    localStorage.setItem('hal-explorer.theme', 'Cosmo');
    localStorage.setItem('hal-explorer.scrollableDocumentation', 'true');
    window.location.hash = '#uri=https://example.com/api';
    service = new AppService();

    expect(service.getScrollableDocumentation()).toBeTrue();
    expect(service.getTheme()).toBe('Cosmo');
    expect(service.getUri()).toBe('https://example.com/api');
  });
});
