import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterOutlet, RouterLinkWithHref } from '@angular/router';
import { ThemeStore } from './core/theme/theme.store';
import { getVersion } from '@tauri-apps/api/app'
import { getCurrentWindow } from '@tauri-apps/api/window'

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatToolbarModule, MatIconModule, MatButtonModule, RouterLinkWithHref, MatSlideToggleModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  version = signal<string>('');
  protected readonly title = computed(() => `Storehouse`);
  mode = inject(ThemeStore);

  constructor() {
    this.updateWindow();
  }
  
  async getCurrentVersion() {
    const version = await getVersion();
    this.version.set(version);
  }

  async updateWindow() {
    await this.getCurrentVersion();
    await getCurrentWindow().setTitle(`Storehouse ${this.version()}`);
  }

  themeChange() {
    this.mode.isDark.update(value => !value);
  }

  getSliderPosition() {
    return this.mode.isDark()
  }
}
