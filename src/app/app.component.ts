import {Component, OnInit} from '@angular/core';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {RequestService} from './request/request.service';

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
    'Pulse',
    'Sandstone',
    'Simplex',
    'Sketchy',
    'Slate',
    'Solar',
    'Spacelab',
    'Superhero',
    'United',
    'Yeti'
  ];

  layouts: string[] = [
    '2 Columns',
    '3 Columns'
  ];

  isCustomTheme = false;
  selectedThemeUrl: SafeResourceUrl;
  showDocumentation: boolean;
  isTwoColumnLayout = true;

  constructor(private requestService: RequestService, private sanitizer: DomSanitizer) {
  }

  ngOnInit(): void {
    this.requestService.getResponseObservable()
      .subscribe(() => {
        this.showDocumentation = false;
      });
    this.requestService.getDocumentationObservable()
      .subscribe(() => {
        console.log('AppComponent got notified');
        this.showDocumentation = true;
      });
  }

  changeTheme(theme: string) {
    if (theme === this.themes[0]) {
      this.isCustomTheme = false;
    } else {
      this.isCustomTheme = true;
      this.selectedThemeUrl =
        this.sanitizer.bypassSecurityTrustResourceUrl('http://bootswatch.com/4/' + theme.toLowerCase() + '/bootstrap.min.css');
    }
  }

  changeLayout(layout: string) {
    this.isTwoColumnLayout = (layout === this.layouts[0]);
  }

}
