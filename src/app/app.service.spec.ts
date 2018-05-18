import {AppService, RequestHeader} from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(() => {
    window.location.hash = '';
    service = new AppService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set custom theme', () => {
    service.setTheme('Cosmo');
    expect(service.getTheme()).toBe('Cosmo');
    expect(window.location.hash).toBe('#theme=Cosmo');
  });

  it('should set default theme', () => {
    service.setTheme('Default');
    expect(service.getTheme()).toBe('Default');
    expect(window.location.hash).toBe('');
  });

  it('should set 2 column layout', () => {
    service.setLayout('2');
    expect(service.getLayout()).toBe('2');
    expect(window.location.hash).toBe('');
  });

  it('should set 3 column layout', () => {
    service.setLayout('3');
    expect(service.getLayout()).toBe('3');
    expect(window.location.hash).toBe('#layout=3');
  });

  it('should set request headers', () => {
    const requestHeader1 = new RequestHeader('accept', 'application/json');
    const requestHeader2 = new RequestHeader('authorization', 'bearer euztsfghfhgwztuzt');

    service.setCustomRequestHeaders([requestHeader1, requestHeader2]);

    expect(service.getCustomRequestHeaders()[0].key).toBe('accept');
    expect(service.getCustomRequestHeaders()[0].value).toBe('application/json');
    expect(service.getCustomRequestHeaders()[1].key).toBe('authorization');
    expect(service.getCustomRequestHeaders()[1].value).toBe('bearer euztsfghfhgwztuzt');
    expect(window.location.hash).toBe('#hkey0=accept&hval0=application/json&hkey1=authorization&hval1=bearer%20euztsfghfhgwztuzt');
  });

  it('should parse window location hash', () => {
    window.location.hash = '#theme=Cosmo&layout=3&hkey0=accept&hval0=text/plain&url=https://chatty42.herokuapp.com/api/users';
    service = new AppService();

    expect(service.getCustomRequestHeaders()[0].key).toBe('accept');
    expect(service.getCustomRequestHeaders()[0].value).toBe('text/plain');
    expect(service.getLayout()).toBe('3');
    expect(service.getTheme()).toBe('Cosmo');
    expect(service.getUrl()).toBe('https://chatty42.herokuapp.com/api/users');

  });


});
