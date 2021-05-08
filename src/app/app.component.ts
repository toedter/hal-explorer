import {Component, OnInit} from '@angular/core';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {RequestService} from './request/request.service';
import {AppService} from './app.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  themes: string[] = [
    'Default',
    'Cerulean',
    'Cosmo',
    'Cyborg',
    'Darkly',
    'Flatly',
    'Journal',
    'Litera',
    'Lumen',
    'Lux',
    'Materia',
    'Minty',
    'Morph',
    'Pulse',
    'Quartz',
    'Sandstone',
    'Simplex',
    'Sketchy',
    'Slate',
    'Solar',
    'Spacelab',
    'Superhero',
    'United',
    'Vapor',
    'Yeti',
    'Zephyr'
  ];

  layouts: string[] = [
    '2 Columns',
    '3 Columns'
  ];

  isCustomTheme = false;
  selectedThemeUrl: SafeResourceUrl;
  showDocumentation = false;
  isTwoColumnLayout = true;

  version = '0.17.0-SNAPSHOT';
  isSnapshotVersion = this.version.endsWith('SNAPSHOT');

  constructor(
    private appService: AppService,
    private requestService: RequestService,
    private sanitizer: DomSanitizer) {
  }

  ngOnInit(): void {
    this.requestService.getResponseObservable()
      .subscribe(() => {
        this.showDocumentation = false;
      });

    this.requestService.getDocumentationObservable()
      .subscribe(() => {
        this.showDocumentation = true;
      });

    this.appService.themeObservable.subscribe(theme => this.changeTheme(theme));
    this.changeTheme(this.appService.getTheme());

    this.appService.layoutObservable.subscribe(layout => this.changeLayout(layout));
    this.changeLayout(this.appService.getLayout());
  }

  changeTheme(theme: string) {
    this.isCustomTheme = theme !== this.themes[0];
    if (this.isCustomTheme) {
      this.selectedThemeUrl =
        this.sanitizer.bypassSecurityTrustResourceUrl('https://bootswatch.com/5/' + theme.toLowerCase() + '/bootstrap.min.css');
    }
    this.appService.setTheme(theme);
  }

  changeLayout(layout: string) {
    this.appService.setLayout(layout.substring(0, 1));
    this.isTwoColumnLayout = this.appService.getLayout() === '2';
  }
}
