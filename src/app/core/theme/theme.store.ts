import { computed, effect, Injectable, signal } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class ThemeStore {
    readonly isDark = signal(false);

  constructor() {
    this.applyTheme();

    effect(() => {
    document.body.classList.toggle('dark', this.isDark());
    document.body.classList.toggle('light', !this.isDark());

    localStorage.setItem('theme', this.isDark() ? 'dark' : 'light');
    });
  }

  private applyTheme() {
    const saved = localStorage.getItem('theme');

    switch (saved) {
      case 'dark':
        this.isDark.set(true);
        break;
      case 'light':
        this.isDark.set(false);
        break;
      default:
        this.isDark.set(window.matchMedia('(prefers-color-scheme: dark)').matches);
        break;
    }
  }
}
