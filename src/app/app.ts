import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterOutlet, RouterLinkWithHref } from '@angular/router';
import { ThemeStore } from './core/theme/theme.store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatToolbarModule, MatIconModule, MatButtonModule, RouterLinkWithHref, MatSlideToggleModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('High Hold Storehouse');
  mode = inject(ThemeStore);

  themeChange() {
    this.mode.isDark.update(value => !value);
  }

  getSliderPosition() {
    return this.mode.isDark()
  }
}
