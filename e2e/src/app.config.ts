import * as os from 'os';

export class AppConfig {
  static getChattyApiUrl()  {
    const operatingSystem = os.platform();
    if (operatingSystem === 'win32') {
      // this is the default docker ip for running Docker within VirtualBox
      // if Docker for Windows is used, replace 192.168.99.100 with 127.0.0.1
      return 'http://192.168.99.101:8080/api';
    }
    return 'http://127.0.0.1:8080/api';
  }
}
