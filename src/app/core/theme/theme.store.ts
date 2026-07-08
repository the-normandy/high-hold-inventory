import { effect, Injectable, signal } from '@angular/core';

export type AccentTheme =
  | 'default'
  | 'summer'
  | 'spring'
  | 'autumn'
  | 'winter'
  | 'duskwillow'
  | 'high-hold';

@Injectable({
  providedIn: 'root'
})
export class ThemeStore {
  readonly isDark = signal(false);
  readonly accent = signal<AccentTheme>('default');

  isAccentTheme(accent: AccentTheme) {
    const html = document.documentElement;
    return this.accent() === accent.toLowerCase();
  }

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
        'default',
        'summer',
        'spring',
        'autumn',
        'winter',
        'duskwillow',
        'high-hold'
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
      savedAccent === 'default' ||
      savedAccent === 'summer' ||
      savedAccent === 'spring' ||
      savedAccent === 'autumn' ||
      savedAccent === 'winter' ||
      savedAccent === 'duskwillow'
    ) {
      this.accent.set(savedAccent);
    }
  }
}