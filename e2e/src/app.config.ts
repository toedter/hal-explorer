import * as os from 'os';

export class AppConfig {
  static getChattyApiUrl()  {
    const operatingSystem = os.platform();
    if (operatingSystem === 'win32') {
      // this is the default docker ip for running Docker within VirtualBox
      // TODO: find out, if Hyper-V is used
      return 'http://192.168.99.100:8080/api';
    }
    return 'http://127.0.0.1:8080/api';
  }
}
