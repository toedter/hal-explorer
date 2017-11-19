import {Component} from '@angular/core';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private themes: string[] = [
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

  private isCustomTheme = false;
  private selectedThemeUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
  };

  changeTheme(theme: string) {
    if (theme === this.themes[0]) {
      this.isCustomTheme = false;
    } else {
      this.isCustomTheme = true;
      this.selectedThemeUrl =
        this.sanitizer.bypassSecurityTrustResourceUrl('http://bootswatch.com/4/' + theme.toLowerCase() + '/bootstrap.min.css');
    }
  }
}
