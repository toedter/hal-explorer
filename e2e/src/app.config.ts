export class AppConfig {
  static getChattyApiUrl()  {
    // if you are using Docker with docker-machine and VirtualBox on Windows,
    // replace localhost with your docker-machine's ip, e.g. 192.168.99.100
    return 'http://localhost:8080/api';
  }
}
