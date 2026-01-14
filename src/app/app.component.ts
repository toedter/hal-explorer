import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
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
  readonly version = '2.2.1';
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

  // Resizable columns state
  private readonly column1WidthSignal = signal(33.33);
  private readonly column2WidthSignal = signal(33.33);
  private readonly column3WidthSignal = signal(33.34);
  readonly resizingHandle = signal<number | null>(null);
  private startX = 0;
  private startWidths: number[] = [];

  readonly column1Width = computed(() => {
    if (this.isTwoColumnLayout) {
      return this.column1WidthSignal();
    }
    return this.column1WidthSignal();
  });

  readonly column2Width = computed(() => {
    if (this.isTwoColumnLayout) {
      return 100 - this.column1WidthSignal();
    }
    return this.column2WidthSignal();
  });

  readonly column3Width = computed(() => {
    return this.column3WidthSignal();
  });

  constructor() {
    // Load saved column widths from localStorage
    const savedWidths = localStorage.getItem('hal-explorer.columnWidths');
    if (savedWidths) {
      try {
        const widths = JSON.parse(savedWidths);
        if (widths.column1) this.column1WidthSignal.set(widths.column1);
        if (widths.column2) this.column2WidthSignal.set(widths.column2);
        if (widths.column3) this.column3WidthSignal.set(widths.column3);
      } catch {
        // Ignore invalid JSON
      }
    }

    // Save column widths when they change
    effect(() => {
      const widths = {
        column1: this.column1WidthSignal(),
        column2: this.column2WidthSignal(),
        column3: this.column3WidthSignal(),
      };
      localStorage.setItem('hal-explorer.columnWidths', JSON.stringify(widths));
    });
  }

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

  startResize(event: MouseEvent | TouchEvent, handleIndex: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.resizingHandle.set(handleIndex);

    // Get the starting X position from either mouse or touch event
    this.startX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;

    if (this.isTwoColumnLayout) {
      this.startWidths = [this.column1WidthSignal()];
    } else {
      this.startWidths = [this.column1WidthSignal(), this.column2WidthSignal(), this.column3WidthSignal()];
    }

    const onMove = (e: MouseEvent | TouchEvent) => this.onResize(e);
    const onEnd = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
      this.resizingHandle.set(null);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  private onResize(event: MouseEvent | TouchEvent): void {
    const handleIndex = this.resizingHandle();
    if (handleIndex === null) return;

    // Prevent scrolling on touch devices
    if (event instanceof TouchEvent) {
      event.preventDefault();
    }

    const containerWidth = document.querySelector('.resizable-layout')?.clientWidth || 1;
    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const deltaX = clientX - this.startX;
    const deltaPercent = (deltaX / containerWidth) * 100;

    if (this.isTwoColumnLayout) {
      // 2 column layout: only handle 1 exists
      const newColumn1Width = Math.max(10, Math.min(90, this.startWidths[0] + deltaPercent));
      this.column1WidthSignal.set(newColumn1Width);
    } else if (handleIndex === 1) {
      // Resizing between column 1 and 2
      const newColumn1Width = Math.max(10, Math.min(80, this.startWidths[0] + deltaPercent));
      const newColumn2Width = Math.max(10, this.startWidths[1] - deltaPercent);

      if (newColumn1Width >= 10 && newColumn2Width >= 10) {
        this.column1WidthSignal.set(newColumn1Width);
        this.column2WidthSignal.set(newColumn2Width);
      }
    } else if (handleIndex === 2) {
      // Resizing between column 2 and 3
      const newColumn2Width = Math.max(10, Math.min(80, this.startWidths[1] + deltaPercent));
      const newColumn3Width = Math.max(10, this.startWidths[2] - deltaPercent);

      if (newColumn2Width >= 10 && newColumn3Width >= 10) {
        this.column2WidthSignal.set(newColumn2Width);
        this.column3WidthSignal.set(newColumn3Width);
      }
    }
  }
}
