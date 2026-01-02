import { Component, OnInit, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RequestService } from './request/request.service';
import { AppService } from './app.service';
import { DocumentationComponent } from './documentation/documentation.component';
import { ResponseDetailsComponent } from './response-details/response-details.component';
import { ResponseExplorerComponent } from './response-explorer/response-explorer.component';
import { RequestComponent } from './request/request.component';

const THEMES = [
  'Bootstrap Default',
  '---',
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

const SETTINGS = [
  '2 Column Layout',
  '3 Column Layout',
  '---',
  'Use HTTP OPTIONS',
  '---',
  'Enable all HTTP Methods for HAL-FORMS Links',
  '---',
  'Scrollable Documentation',
];

type ColorMode = 'light' | 'dark' | 'auto';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [RequestComponent, ResponseExplorerComponent, ResponseDetailsComponent, DocumentationComponent],
})
export class AppComponent implements OnInit {
  readonly themes = THEMES;
  readonly settings = SETTINGS;
  readonly version = '2.0.1-SNAPSHOT';
  readonly isSnapshotVersion = this.version.endsWith('SNAPSHOT');

  isCustomTheme = false;
  selectedThemeUrl: SafeResourceUrl;
  showDocumentation = false;
  isTwoColumnLayout = true;
  useHttpOptions = false;
  enableAllHttpMethodsForLinks = false;
  scrollableDocumentation = false;
  activeColorMode: ColorMode = 'auto';

  private readonly appService = inject(AppService);
  private readonly requestService = inject(RequestService);
  private readonly sanitizer = inject(DomSanitizer);

  ngOnInit(): void {
    this.initializeColorMode();
    this.subscribeToServices();
    this.applyCurrentSettings();
  }

  private subscribeToServices(): void {
    this.requestService.getResponseObservable().subscribe(() => {
      this.showDocumentation = false;
    });

    this.requestService.getDocumentationObservable().subscribe(() => {
      this.showDocumentation = true;
    });

    this.appService.themeObservable.subscribe(theme => this.applyTheme(theme));
    this.appService.columnLayoutObservable.subscribe(layout => this.applyLayout(layout));
    this.appService.httpOptionsObservable.subscribe(options => this.applyHttpOptions(options));
    this.appService.allHttpMethodsForLinksObservable.subscribe(enabled => this.applyAllHttpMethodsForLinks(enabled));
    this.appService.scrollableDocumentationObservable.subscribe(scrollable =>
      this.applyScrollableDocumentation(scrollable)
    );
  }

  private applyCurrentSettings(): void {
    this.applyTheme(this.appService.getTheme());
    this.applyLayout(this.appService.getColumnLayout());
    this.applyHttpOptions(this.appService.getHttpOptions());
    this.applyAllHttpMethodsForLinks(this.appService.getAllHttpMethodsForLinks());
    this.applyScrollableDocumentation(this.appService.getScrollableDocumentation());
  }

  changeTheme(theme: string): void {
    this.appService.setTheme(theme);
  }

  private applyTheme(theme: string): void {
    this.isCustomTheme = theme !== THEMES[0];
    if (this.isCustomTheme) {
      this.selectedThemeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://bootswatch.com/5/${theme.toLowerCase()}/bootstrap.min.css`
      );
    }
  }

  changeLayout(layout: string): void {
    this.appService.setColumnLayout(layout.substring(0, 1));
  }

  private applyLayout(layout: string): void {
    this.isTwoColumnLayout = layout === '2';
  }

  private applyHttpOptions(httpOptions: boolean): void {
    this.useHttpOptions = httpOptions;
  }

  private applyAllHttpMethodsForLinks(enabled: boolean): void {
    this.enableAllHttpMethodsForLinks = enabled;
  }

  private applyScrollableDocumentation(scrollable: boolean): void {
    this.scrollableDocumentation = scrollable;
  }

  selectSetting(setting: string): void {
    if (setting.includes('OPTIONS')) {
      const newValue = !this.useHttpOptions;
      this.useHttpOptions = newValue;
      this.appService.setHttpOptions(newValue);
    } else if (setting.includes('Links')) {
      const newValue = !this.enableAllHttpMethodsForLinks;
      this.enableAllHttpMethodsForLinks = newValue;
      this.appService.setAllHttpMethodsForLinks(newValue);
    } else if (setting.includes('Scrollable')) {
      const newValue = !this.scrollableDocumentation;
      this.scrollableDocumentation = newValue;
      this.appService.setScrollableDocumentation(newValue);
    } else {
      this.changeLayout(setting);
    }
  }

  getThemeIconCheckStyle(theme: string): string {
    return theme === this.appService.getTheme() ? '' : 'visibility: hidden';
  }

  getSettingsIconCheckStyle(setting: string): string {
    const isActive =
      (setting.includes('OPTIONS') && this.useHttpOptions) ||
      setting.includes(this.appService.getColumnLayout()) ||
      (setting.includes('Links') && this.enableAllHttpMethodsForLinks) ||
      (setting.includes('Scrollable') && this.scrollableDocumentation);

    return isActive ? '' : 'visibility: hidden';
  }

  blurActiveElement() {
    // Blur the active element to prevent aria-hidden accessibility violation
    // when Bootstrap closes the modal
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  initializeColorMode(): void {
    const storedColorMode = localStorage.getItem('hal-explorer.colorMode') as ColorMode | null;
    this.activeColorMode = storedColorMode || 'auto';
    this.applyColorMode();
  }

  setColorMode(mode: ColorMode): void {
    this.activeColorMode = mode;
    localStorage.setItem('hal-explorer.colorMode', mode);
    this.applyColorMode();
  }

  private applyColorMode(): void {
    let effectiveMode = this.activeColorMode;

    if (effectiveMode === 'auto') {
      const prefersDark = globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveMode = prefersDark ? 'dark' : 'light';
    }

    document.documentElement.dataset.bsTheme = effectiveMode;
  }
}
