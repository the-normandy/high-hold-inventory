import { effect, Injectable, signal } from '@angular/core';

export type AccentTheme =
  | 'azure'
  | 'violet'
  | 'emerald'
  | 'cyan';

@Injectable({
  providedIn: 'root'
})
export class ThemeStore {
  readonly isDark = signal(false);
  readonly accent = signal<AccentTheme>('azure');

  constructor() {
    this.applyTheme();

    effect(() => {
      document.body.classList.toggle('dark', this.isDark());
      document.body.classList.toggle('light', !this.isDark());

      localStorage.setItem('theme', this.isDark() ? 'dark' : 'light');
    });

    effect(() => {
      const html = document.documentElement;

      html.classList.remove(
        'azure',
        'violet',
        'emerald',
        'cyan'
      );

      html.classList.add(this.accent());

      localStorage.setItem('accent', this.accent());
    });
  }

  private applyTheme() {
    const savedTheme = localStorage.getItem('theme');
    const savedAccent = localStorage.getItem('accent') as AccentTheme | null;

    switch (savedTheme) {
      case 'dark':
        this.isDark.set(true);
        break;

      case 'light':
        this.isDark.set(false);
        break;

      default:
        this.isDark.set(
          window.matchMedia('(prefers-color-scheme: dark)').matches
        );
    }

    if (
      savedAccent === 'azure' ||
      savedAccent === 'violet' ||
      savedAccent === 'emerald' ||
      savedAccent === 'cyan'
    ) {
      this.accent.set(savedAccent);
    }
  }
}