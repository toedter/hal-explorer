import { Component, OnInit, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RequestService } from './request/request.service';
import { AppService } from './app.service';
import { DocumentationComponent } from './documentation/documentation.component';
import { ResponseDetailsComponent } from './response-details/response-details.component';
import { ResponseExplorerComponent } from './response-explorer/response-explorer.component';
import { RequestComponent } from './request/request.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [RequestComponent, ResponseExplorerComponent, ResponseDetailsComponent, DocumentationComponent],
})
export class AppComponent implements OnInit {
  themes: string[] = [
    'Default',
    'Brite',
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
    'Zephyr',
  ];

  layouts: string[] = ['2 Columns', '3 Columns'];

  settings: string[] = [
    '2 Column Layout',
    '3 Column Layout',
    '---',
    'Use HTTP OPTIONS',
    '---',
    'Enable all HTTP Methods for HAL-FORMS Links',
    '---',
    'Scrollable Documentation',
  ];

  isCustomTheme = false;
  selectedThemeUrl: SafeResourceUrl;
  showDocumentation = false;
  isTwoColumnLayout = true;
  useHttpOptions = false;
  enableAllHttpMethodsForLinks = false;
  scrollableDocumentation = false;
  activeColorMode: 'light' | 'dark' | 'auto' = 'auto';

  version = '2.0.0-SNAPSHOT';
  isSnapshotVersion = this.version.endsWith('SNAPSHOT');

  private readonly appService = inject(AppService);
  private readonly requestService = inject(RequestService);
  private readonly sanitizer = inject(DomSanitizer);

  ngOnInit(): void {
    // Initialize color mode from localStorage or default to 'auto'
    this.initializeColorMode();

    this.requestService.getResponseObservable().subscribe(() => {
      this.showDocumentation = false;
    });

    this.requestService.getDocumentationObservable().subscribe(() => {
      this.showDocumentation = true;
    });

    this.appService.themeObservable.subscribe(theme => this.changeTheme(theme));
    this.changeTheme(this.appService.getTheme());

    this.appService.columnLayoutObservable.subscribe(layout => this.changeLayout(layout));
    this.changeLayout(this.appService.getColumnLayout());

    this.appService.httpOptionsObservable.subscribe(useHttpOptions => this.changeHttpOptions(useHttpOptions));
    this.changeHttpOptions(this.appService.getHttpOptions());

    this.appService.allHttpMethodsForLinksObservable.subscribe(allHttpMethodsForLinks =>
      this.changeAllHttpMethodsForLinks(allHttpMethodsForLinks)
    );
    this.changeAllHttpMethodsForLinks(this.appService.getAllHttpMethodsForLinks());

    this.appService.scrollableDocumentationObservable.subscribe(scrollableDocumentation =>
      this.changeScrollableDocumentation(scrollableDocumentation)
    );
    this.changeScrollableDocumentation(this.appService.getScrollableDocumentation());
  }

  changeTheme(theme: string) {
    this.isCustomTheme = theme !== this.themes[0];
    if (this.isCustomTheme) {
      this.selectedThemeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        'https://bootswatch.com/5/' + theme.toLowerCase() + '/bootstrap.min.css'
      );
    }
    this.appService.setTheme(theme);
  }

  changeLayout(layout: string) {
    this.appService.setColumnLayout(layout.substring(0, 1));
    this.isTwoColumnLayout = this.appService.getColumnLayout() === '2';
  }

  changeHttpOptions(httpOptions: boolean) {
    this.appService.setHttpOptions(httpOptions);
    this.useHttpOptions = httpOptions;
  }

  changeAllHttpMethodsForLinks(allHttpMethodsForLinks: boolean) {
    this.appService.setAllHttpMethodsForLinks(allHttpMethodsForLinks);
    this.enableAllHttpMethodsForLinks = allHttpMethodsForLinks;
  }

  changeScrollableDocumentation(scrollableDocumentation: boolean) {
    this.appService.setScrollableDocumentation(scrollableDocumentation);
    this.scrollableDocumentation = scrollableDocumentation;
  }

  selectSetting(setting: string) {
    if (setting.includes('OPTIONS')) {
      this.useHttpOptions = !this.useHttpOptions;
      this.appService.setHttpOptions(this.useHttpOptions);
    } else if (setting.includes('Links')) {
      this.enableAllHttpMethodsForLinks = !this.enableAllHttpMethodsForLinks;
      this.appService.setAllHttpMethodsForLinks(this.enableAllHttpMethodsForLinks);
    } else if (setting.includes('Scrollable')) {
      this.scrollableDocumentation = !this.scrollableDocumentation;
      this.appService.setScrollableDocumentation(this.scrollableDocumentation);
    } else {
      this.changeLayout(setting);
    }
  }

  getThemeIconCheckStyle(theme: string): string {
    if (theme === this.appService.getTheme()) {
      return '';
    }

    return 'visibility: hidden';
  }

  getSettingsIconCheckStyle(setting: string): string {
    if (
      (setting.includes('OPTIONS') && this.useHttpOptions) ||
      setting.includes(this.appService.getColumnLayout()) ||
      (setting.includes('Links') && this.enableAllHttpMethodsForLinks) ||
      (setting.includes('Scrollable') && this.scrollableDocumentation)
    ) {
      return '';
    }

    return 'visibility: hidden';
  }

  initializeColorMode(): void {
    const storedColorMode = localStorage.getItem('hal-explorer.colorMode') as 'light' | 'dark' | 'auto' | null;
    this.activeColorMode = storedColorMode || 'auto';
    this.applyColorMode();
  }

  setColorMode(mode: 'light' | 'dark' | 'auto'): void {
    this.activeColorMode = mode;
    localStorage.setItem('hal-explorer.colorMode', mode);
    this.applyColorMode();
  }

  private applyColorMode(): void {
    let effectiveMode = this.activeColorMode;

    // If auto, detect system preference
    if (effectiveMode === 'auto') {
      effectiveMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // Apply the theme to the document
    document.documentElement.setAttribute('data-bs-theme', effectiveMode);
  }
}
